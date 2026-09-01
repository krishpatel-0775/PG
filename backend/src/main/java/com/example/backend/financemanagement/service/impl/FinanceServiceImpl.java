package com.example.backend.financemanagement.service.impl;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.request.RecordPaymentRequest;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.dto.response.PaymentResponse;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.financemanagement.entity.PaymentMode;
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
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of {@link FinanceService} handling anniversary-date daily billing cycles,
 * automated invoice generation, payment processing, and tenant dues tracking.
 */
@Service
@Transactional
public class FinanceServiceImpl implements FinanceService {

    private static final Logger log = LoggerFactory.getLogger(FinanceServiceImpl.class);
    private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("MMM-yyyy");

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
     * Scheduled cron job running daily at 1:00 AM (0 0 1 * * ?).
     * Evaluates all ACTIVE tenant allocations and generates an anniversary invoice if today is their billing day.
     * Handles variable month lengths and leap years (e.g. 31st check-in billed on Feb 28th/29th or Apr 30th).
     */
    @Override
    @Scheduled(cron = "0 0 1 * * ?")
    @Transactional
    public List<InvoiceResponse> generateDailyInvoices() {
        LocalDate today = LocalDate.now();
        log.info("Starting daily anniversary billing job for date: {}", today);

        List<Allocation> activeAllocations = allocationRepository.findByStatus(AllocationStatus.ACTIVE);
        List<Invoice> generatedInvoices = new ArrayList<>();

        for (Allocation allocation : activeAllocations) {
            LocalDate checkInDate = allocation.getCheckInDate();
            if (checkInDate == null) {
                log.warn("Active allocation ID {} has null check-in date. Skipping.", allocation.getId());
                continue;
            }

            // Do not bill before the allocation check-in date
            if (today.isBefore(checkInDate)) {
                log.debug("Allocation ID {} check-in date {} is in the future. Skipping.", allocation.getId(), checkInDate);
                continue;
            }

            // Anniversary billing calculation
            int checkInDay = checkInDate.getDayOfMonth();
            int daysInCurrentMonth = today.lengthOfMonth();
            int targetBillingDay = Math.min(checkInDay, daysInCurrentMonth);

            if (today.getDayOfMonth() == targetBillingDay) {
                // Check if invoice already exists for this allocation on today's billing date
                if (!invoiceRepository.existsByAllocationIdAndInvoiceDate(allocation.getId(), today)) {
                    Invoice invoice = Invoice.builder()
                            .allocation(allocation)
                            .invoiceDate(today)
                            .dueDate(today.plusDays(5))
                            .totalAmount(allocation.getMonthlyRent())
                            .amountPaid(BigDecimal.ZERO)
                            .status(InvoiceStatus.UNPAID)
                            .invoiceMonth(today.format(MONTH_FORMATTER))
                            .build();

                    Invoice savedInvoice = invoiceRepository.save(invoice);
                    generatedInvoices.add(savedInvoice);

                    log.info("Generated anniversary invoice ID {} for allocation ID {} (Tenant: {}, Amount: ₹{})",
                            savedInvoice.getId(),
                            allocation.getId(),
                            allocation.getTenant() != null ? allocation.getTenant().getEmail() : "N/A",
                            allocation.getMonthlyRent());
                } else {
                    log.debug("Invoice already exists for allocation ID {} on date {}. Skipping duplicate generation.",
                            allocation.getId(), today);
                }
            }
        }

        log.info("Completed daily anniversary billing job for date {}. Total new invoices generated: {}",
                today, generatedInvoices.size());

        return generatedInvoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Records a manual payment (Cash, UPI, etc.) against an invoice.
     * Updates the invoice's amountPaid and transitions its status (PAID / PARTIALLY_PAID).
     */
    @Override
    @Transactional
    public PaymentResponse recordManualPayment(RecordPaymentRequest request) {
        Invoice invoice = invoiceRepository.findById(request.getInvoiceId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found with ID: " + request.getInvoiceId()));

        // Create and save payment entity
        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(request.getAmount())
                .paymentDate(LocalDate.now())
                .mode(request.getMode())
                .referenceId(request.getReferenceId())
                .transactionId(request.getReferenceId())
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Update invoice's paid amount
        BigDecimal currentPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal totalAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal newAmountPaid = currentPaid.add(request.getAmount());

        invoice.setAmountPaid(newAmountPaid);

        // Update status based on total vs paid amount
        if (newAmountPaid.compareTo(totalAmount) >= 0) {
            invoice.setStatus(InvoiceStatus.PAID);
        } else {
            invoice.setStatus(InvoiceStatus.PARTIALLY_PAID);
        }

        invoiceRepository.save(invoice);

        log.info("Recorded manual payment ID {} of ₹{} for Invoice ID {}. New status: {}",
                savedPayment.getId(), request.getAmount(), invoice.getId(), invoice.getStatus());

        return PaymentResponse.fromEntity(savedPayment);
    }

    /**
     * Simulates an online tenant payment gateway settlement for a given invoice.
     * Automatically clears the remaining due and sets invoice status to PAID.
     */
    @Override
    @Transactional
    public PaymentResponse mockTenantOnlinePayment(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invoice not found with ID: " + invoiceId));

        BigDecimal totalAmount = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal currentPaid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal remainingDue = totalAmount.subtract(currentPaid).max(BigDecimal.ZERO);
        BigDecimal paymentAmount = remainingDue.compareTo(BigDecimal.ZERO) > 0 ? remainingDue : totalAmount;

        String fakeTxnId = "MOCK_PAY_" + UUID.randomUUID().toString().replace("-", "").substring(0, 10).toUpperCase();

        Payment payment = Payment.builder()
                .invoice(invoice)
                .amount(paymentAmount)
                .paymentDate(LocalDate.now())
                .mode(PaymentMode.ONLINE)
                .referenceId(fakeTxnId)
                .transactionId(fakeTxnId)
                .remarks("Simulated online gateway payment")
                .build();

        Payment savedPayment = paymentRepository.save(payment);

        // Fully settle the invoice
        invoice.setAmountPaid(totalAmount);
        invoice.setStatus(InvoiceStatus.PAID);
        invoiceRepository.save(invoice);

        log.info("Processed mock online payment ID {} of ₹{} for Invoice ID {}. Invoice marked PAID.",
                savedPayment.getId(), paymentAmount, invoice.getId());

        return PaymentResponse.fromEntity(savedPayment);
    }

    /**
     * Retrieves all pending (UNPAID and PARTIALLY_PAID) invoices for properties owned by the authenticated owner.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getPendingOwnerInvoices(String ownerEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + ownerEmail));

        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

        List<Invoice> invoices = isSuperAdmin
                ? invoiceRepository.findByStatusIn(pendingStatuses)
                : invoiceRepository.findByAllocationBedRoomPropertyOwnerIdAndStatusIn(user.getId(), pendingStatuses);

        return invoices.stream()
                .map(InvoiceResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all invoices for the authenticated tenant across all allocations.
     */
    @Override
    @Transactional(readOnly = true)
    public List<InvoiceResponse> getMyInvoices(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant account not found: " + tenantEmail));

        List<Invoice> invoices = invoiceRepository.findByAllocationTenantId(tenant.getId());

        return invoices.stream()
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
                .referenceId(request.getTransactionId())
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
        return getPendingOwnerInvoices(userEmail, isSuperAdmin);
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
     * Retrieves all pending dues for the authenticated tenant.
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

    /**
     * Compatibility helper method for generating invoices on-demand.
     */
    @Override
    public List<InvoiceResponse> generateMonthlyInvoices() {
        return generateDailyInvoices();
    }
}
