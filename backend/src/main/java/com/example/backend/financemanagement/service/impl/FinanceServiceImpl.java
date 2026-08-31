package com.example.backend.financemanagement.service.impl;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.dto.response.PaymentResponse;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.financemanagement.repository.PaymentRepository;
import com.example.backend.financemanagement.service.FinanceService;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link FinanceService} handling automatic monthly billing,
 * payment recording with overpayment guards, and pending dues retrieval.
 */
@Service
@Transactional
public class FinanceServiceImpl implements FinanceService {

    private static final Logger log = LoggerFactory.getLogger(FinanceServiceImpl.class);

    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final AllocationRepository allocationRepository;
    private final UserRepository userRepository;

    public FinanceServiceImpl(InvoiceRepository invoiceRepository,
                              PaymentRepository paymentRepository,
                              AllocationRepository allocationRepository,
                              UserRepository userRepository) {
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.allocationRepository = allocationRepository;
        this.userRepository = userRepository;
    }

    /**
     * Runs automatically on the 1st of every month at midnight (00:00:00).
     * Generates an invoice for each ACTIVE tenant allocation.
     */
    @Override
    @Scheduled(cron = "0 0 0 1 * ?")
    public List<InvoiceResponse> generateMonthlyInvoices() {
        YearMonth currentMonth = YearMonth.now();
        String invoiceMonth = currentMonth.format(DateTimeFormatter.ofPattern("MMM-yyyy"));
        LocalDate dueDate = currentMonth.atDay(Math.min(5, currentMonth.lengthOfMonth()));

        log.info("Starting automated monthly invoice generation for month: {}", invoiceMonth);

        List<Allocation> activeAllocations = allocationRepository.findByStatus(AllocationStatus.ACTIVE);
        List<Invoice> generatedInvoices = new ArrayList<>();

        for (Allocation allocation : activeAllocations) {
            // Prevent duplicate invoicing for the same allocation and month
            if (invoiceRepository.existsByAllocationIdAndInvoiceMonth(allocation.getId(), invoiceMonth)) {
                log.debug("Invoice for allocation ID {} and month {} already exists. Skipping.", allocation.getId(), invoiceMonth);
                continue;
            }

            Invoice invoice = Invoice.builder()
                    .allocation(allocation)
                    .invoiceMonth(invoiceMonth)
                    .totalAmount(allocation.getMonthlyRent())
                    .amountPaid(BigDecimal.ZERO)
                    .dueDate(dueDate)
                    .status(InvoiceStatus.UNPAID)
                    .build();

            Invoice savedInvoice = invoiceRepository.save(invoice);
            generatedInvoices.add(savedInvoice);
        }

        log.info("Successfully generated {} invoices for month {}", generatedInvoices.size(), invoiceMonth);

        return generatedInvoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Records a payment against an invoice and updates its paid balance and status.
     * Prevents overpayments beyond the outstanding due amount.
     */
    @Override
    public PaymentResponse recordPayment(CreatePaymentRequest request, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found with ID: " + request.getInvoiceId()));

        // Verify ownership
        if (!isSuperAdmin) {
            var propertyOwner = invoice.getAllocation().getBed().getRoom().getProperty().getOwner();
            if (!propertyOwner.getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to record payments for this property.");
            }
        }

        // Check if invoice is already settled
        BigDecimal totalAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal currentPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal outstandingDue = totalAmount.subtract(currentPaid).max(BigDecimal.ZERO);

        if (outstandingDue.compareTo(BigDecimal.ZERO) <= 0 || invoice.getStatus() == InvoiceStatus.PAID) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This invoice is already fully paid and settled.");
        }

        // Prevent overpayment
        if (request.getAmount().compareTo(outstandingDue) > 0) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    String.format("Payment amount ₹%s exceeds the outstanding due of ₹%s.",
                            request.getAmount().toPlainString(),
                            outstandingDue.toPlainString())
            );
        }

        // Update amount paid
        BigDecimal newAmountPaid = currentPaid.add(request.getAmount());
        invoice.setAmountPaid(newAmountPaid);

        // Update status
        if (newAmountPaid.compareTo(totalAmount) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        // Record Payment transaction
        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(request.getAmount())
                .paymentDate(request.getPaymentDate() != null ? request.getPaymentDate() : LocalDate.now())
                .mode(request.getMode())
                .transactionId(request.getTransactionId())
                .remarks(request.getRemarks())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        return PaymentResponse.fromEntity(savedPayment);
    }

    /**
     * Retrieves all pending dues (UNPAID or PARTIALLY_PAID) across the owner's properties.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPendingDues(String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

        List<Invoice> invoices = isSuperAdmin
                ? invoiceRepository.findByStatusIn(pendingStatuses)
                : invoiceRepository.findByAllocationBedRoomPropertyOwnerIdAndStatusIn(user.getId(), pendingStatuses);

        return invoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves outstanding dues for a specific tenant ID.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getTenantDues(Long tenantId, String userEmail, boolean isSuperAdmin) {
        userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);
        List<Invoice> invoices = invoiceRepository.findByAllocationTenantIdAndStatusIn(tenantId, pendingStatuses);

        return invoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all pending dues for the logged-in tenant.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getMyDues(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant account not found: " + tenantEmail));

        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);
        List<Invoice> invoices = invoiceRepository.findByAllocationTenantIdAndStatusIn(tenant.getId(), pendingStatuses);

        return invoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single invoice with its payment history.
     */
    @Override
    @Transactional(readOnly = true)
    public InvoiceResponse getInvoiceById(Long invoiceId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found with ID: " + invoiceId));

        if (!isSuperAdmin) {
            var tenant = invoice.getAllocation().getTenant();
            var propertyOwner = invoice.getAllocation().getBed().getRoom().getProperty().getOwner();

            boolean isOwner = propertyOwner.getId().equals(caller.getId());
            boolean isTenant = tenant.getId().equals(caller.getId());

            if (!isOwner && !isTenant) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this invoice.");
            }
        }

        return InvoiceResponse.fromEntity(invoice);
    }
}
