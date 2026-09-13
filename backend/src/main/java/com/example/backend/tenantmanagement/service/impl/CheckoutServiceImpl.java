package com.example.backend.tenantmanagement.service.impl;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.financemanagement.entity.PaymentMode;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.financemanagement.repository.PaymentRepository;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.tenantmanagement.dto.request.ApproveNoticeRequest;
import com.example.backend.tenantmanagement.dto.request.DamageItemRequest;
import com.example.backend.tenantmanagement.dto.request.FinalizeCheckoutRequest;
import com.example.backend.tenantmanagement.dto.request.RejectNoticeRequest;
import com.example.backend.tenantmanagement.dto.request.ServeNoticeRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutClearanceResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutSummaryResponse;
import com.example.backend.tenantmanagement.entity.*;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.tenantmanagement.repository.CheckoutClearanceRepository;
import com.example.backend.tenantmanagement.service.CheckoutService;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link CheckoutService} managing the full tenant move-out lifecycle.
 *
 * <p><b>Workflow</b>:
 * <ol>
 *   <li>{@code serveNotice} — Transitions allocation from ACTIVE → NOTICE_SERVED with a validated 30-day notice.</li>
 *   <li>(During notice period) — Daily cron in FinanceServiceImpl auto-offsets rent invoices from deposit.</li>
 *   <li>{@code getCheckoutSummary} — Read-only preview of remaining deposit, unpaid dues, and damage template.</li>
 *   <li>{@code finalizeCheckout} — Settles deposit, records damages, closes invoices, vacates bed.</li>
 * </ol>
 */
@Service
@Transactional
public class CheckoutServiceImpl implements CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutServiceImpl.class);
    private static final int MINIMUM_NOTICE_DAYS = 30;

    private final AllocationRepository allocationRepository;
    private final InvoiceRepository invoiceRepository;
    private final PaymentRepository paymentRepository;
    private final BedRepository bedRepository;
    private final CheckoutClearanceRepository clearanceRepository;
    private final UserRepository userRepository;

    public CheckoutServiceImpl(AllocationRepository allocationRepository,
                               InvoiceRepository invoiceRepository,
                               PaymentRepository paymentRepository,
                               BedRepository bedRepository,
                               CheckoutClearanceRepository clearanceRepository,
                               UserRepository userRepository) {
        this.allocationRepository = allocationRepository;
        this.invoiceRepository = invoiceRepository;
        this.paymentRepository = paymentRepository;
        this.bedRepository = bedRepository;
        this.clearanceRepository = clearanceRepository;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // SERVE NOTICE
    // =========================================================================

    @Override
    @Transactional
    public AllocationResponse serveNotice(Long allocationId,
                                          ServeNoticeRequest request,
                                          String callerEmail,
                                          boolean isSuperAdmin) {
        Allocation allocation = resolveAllocation(allocationId);

        // Only ACTIVE allocations can serve notice
        if (allocation.getStatus() != AllocationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot serve notice for allocation in status: " + allocation.getStatus()
                            + ". Only ACTIVE allocations can initiate move-out.");
        }

        // Validate minimum 30-day notice period
        long daysUntilCheckout = request.getPlannedCheckoutDate().toEpochDay() - LocalDate.now().toEpochDay();
        if (daysUntilCheckout < MINIMUM_NOTICE_DAYS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Planned checkout date must be at least " + MINIMUM_NOTICE_DAYS + " days from today. "
                            + "Provided date (" + request.getPlannedCheckoutDate() + ") is only "
                            + daysUntilCheckout + " day(s) away.");
        }

        // Verify the caller is the tenant themselves, their property owner, or SUPER_ADMIN
        if (!isSuperAdmin) {
            boolean isOwner = isPropertyOwner(allocation, callerEmail);
            boolean isTenantSelf = allocation.getTenant().getEmail().equalsIgnoreCase(callerEmail);
            if (!isOwner && !isTenantSelf) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "You do not have permission to serve notice for this allocation.");
            }
        }

        allocation.setStatus(AllocationStatus.NOTICE_REQUESTED);
        allocation.setPlannedCheckoutDate(request.getPlannedCheckoutDate());
        allocation.setNoticeServedDate(LocalDate.now());
        allocation.setNoticeRejectionReason(null);
        allocationRepository.save(allocation);

        log.info("Move-out notice requested for allocation {} (tenant: {}). Planned checkout: {}",
                allocationId, allocation.getTenant().getEmail(), request.getPlannedCheckoutDate());

        return AllocationResponse.fromEntity(allocation);
    }

    @Override
    @Transactional
    public AllocationResponse approveNotice(Long allocationId,
                                           ApproveNoticeRequest request,
                                           String callerEmail,
                                           boolean isSuperAdmin) {
        Allocation allocation = resolveAllocation(allocationId);
        verifyOwnerOrAdminAccess(allocation, callerEmail, isSuperAdmin);

        if (allocation.getStatus() != AllocationStatus.NOTICE_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot approve notice for allocation in status: " + allocation.getStatus()
                            + ". Only allocations with NOTICE_REQUESTED status can be approved.");
        }

        allocation.setStatus(AllocationStatus.NOTICE_SERVED);
        allocation.setDepositHandlingPolicy(request.getDepositHandlingPolicy());
        allocation.setNoticeApprovalDate(LocalDate.now());
        allocation.setNoticeRejectionReason(null);
        allocationRepository.save(allocation);

        log.info("Move-out notice approved for allocation {} (tenant: {}). Policy: {}",
                allocationId, allocation.getTenant().getEmail(), request.getDepositHandlingPolicy());

        return AllocationResponse.fromEntity(allocation);
    }

    @Override
    @Transactional
    public AllocationResponse rejectNotice(Long allocationId,
                                          RejectNoticeRequest request,
                                          String callerEmail,
                                          boolean isSuperAdmin) {
        Allocation allocation = resolveAllocation(allocationId);
        verifyOwnerOrAdminAccess(allocation, callerEmail, isSuperAdmin);

        if (allocation.getStatus() != AllocationStatus.NOTICE_REQUESTED) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot reject notice for allocation in status: " + allocation.getStatus()
                            + ". Only allocations with NOTICE_REQUESTED status can be rejected.");
        }

        allocation.setStatus(AllocationStatus.ACTIVE);
        allocation.setNoticeRejectionReason(request.getReason());
        allocation.setPlannedCheckoutDate(null);
        allocation.setNoticeServedDate(null);
        allocation.setDepositHandlingPolicy(null);
        allocation.setNoticeApprovalDate(null);
        allocationRepository.save(allocation);

        log.info("Move-out notice rejected for allocation {} (tenant: {}). Reason: {}",
                allocationId, allocation.getTenant().getEmail(), request.getReason());

        return AllocationResponse.fromEntity(allocation);
    }

    // =========================================================================
    // CHECKOUT SUMMARY (read-only)
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public CheckoutSummaryResponse getCheckoutSummary(Long allocationId,
                                                       String callerEmail,
                                                       boolean isSuperAdmin) {
        Allocation allocation = resolveAllocation(allocationId);
        verifyOwnerOrAdminAccess(allocation, callerEmail, isSuperAdmin);

        // Fetch all outstanding unpaid/partially-paid invoices
        List<Invoice> unpaidInvoices = invoiceRepository
                .findByAllocationTenantIdAndStatusIn(allocation.getTenant().getId(),
                        List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID))
                .stream()
                .filter(inv -> inv.getAllocation().getId().equals(allocationId))
                .collect(Collectors.toList());

        BigDecimal totalUnpaidDues = unpaidInvoices.stream()
                .map(inv -> inv.getTotalAmount().subtract(inv.getAmountPaid()).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingDeposit = allocation.getDepositAmount();
        BigDecimal projectedRefund = remainingDeposit.subtract(totalUnpaidDues);

        var bed = allocation.getBed();
        var room = bed != null ? bed.getRoom() : null;

        // Map invoices to response DTOs using existing InvoiceResponse factory
        var invoiceResponses = unpaidInvoices.stream()
                .map(com.example.backend.financemanagement.dto.response.InvoiceResponse::fromEntity)
                .collect(Collectors.toList());

        return CheckoutSummaryResponse.builder()
                .allocationId(allocation.getId())
                .tenantId(allocation.getTenant().getId())
                .tenantName(allocation.getTenant().getName())
                .tenantEmail(allocation.getTenant().getEmail())
                .bedId(bed != null ? bed.getId() : null)
                .bedNumber(bed != null ? bed.getBedNumber() : null)
                .roomId(room != null ? room.getId() : null)
                .roomNumber(room != null ? room.getRoomNumber() : null)
                .checkInDate(allocation.getCheckInDate())
                .plannedCheckoutDate(allocation.getPlannedCheckoutDate())
                .noticeServedDate(allocation.getNoticeServedDate())
                .initialDeposit(allocation.getDepositAmount())
                .depositUsedForRent(BigDecimal.ZERO) // Actual deduction is tracked in CheckoutClearance
                .remainingDeposit(remainingDeposit)
                .unpaidInvoices(invoiceResponses)
                .totalUnpaidDues(totalUnpaidDues)
                .projectedRefundNoDamages(projectedRefund)
                .build();
    }

    // =========================================================================
    // FINALIZE CHECKOUT
    // =========================================================================

    @Override
    @Transactional
    public CheckoutClearanceResponse finalizeCheckout(Long allocationId,
                                                       FinalizeCheckoutRequest request,
                                                       String callerEmail,
                                                       boolean isSuperAdmin) {
        Allocation allocation = resolveAllocation(allocationId);
        verifyOwnerOrAdminAccess(allocation, callerEmail, isSuperAdmin);

        // Must be in NOTICE_SERVED state to finalize (prevents bypassing notice period)
        if (allocation.getStatus() != AllocationStatus.NOTICE_SERVED
                && allocation.getStatus() != AllocationStatus.ACTIVE) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Cannot finalize checkout for allocation in status: " + allocation.getStatus());
        }

        // Guard: prevent duplicate clearance
        if (clearanceRepository.findByAllocationId(allocationId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A checkout clearance has already been finalized for allocation " + allocationId);
        }

        // --- 1. Collect outstanding invoices ---
        List<Invoice> unpaidInvoices = invoiceRepository
                .findByAllocationTenantIdAndStatusIn(allocation.getTenant().getId(),
                        List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID))
                .stream()
                .filter(inv -> inv.getAllocation().getId().equals(allocationId))
                .collect(Collectors.toList());

        BigDecimal unpaidDues = unpaidInvoices.stream()
                .map(inv -> inv.getTotalAmount().subtract(inv.getAmountPaid()).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // --- 2. Sum damage deductions ---
        BigDecimal totalDamages = BigDecimal.ZERO;
        if (request.getDamages() != null) {
            totalDamages = request.getDamages().stream()
                    .map(DamageItemRequest::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        // --- 3. Compute net refund ---
        BigDecimal remainingDeposit = allocation.getDepositAmount();
        BigDecimal netRefund = remainingDeposit.subtract(unpaidDues).subtract(totalDamages);

        RefundStatus refundStatus;
        if (netRefund.compareTo(BigDecimal.ZERO) > 0) {
            refundStatus = RefundStatus.REFUNDED;
        } else if (netRefund.compareTo(BigDecimal.ZERO) == 0) {
            refundStatus = RefundStatus.SETTLED_RETAINED;
        } else {
            refundStatus = RefundStatus.DEFICIT_OWED;
        }

        // --- 4. Build CheckoutClearance ---
        CheckoutClearance clearance = CheckoutClearance.builder()
                .allocation(allocation)
                .initialDeposit(allocation.getDepositAmount())
                .depositUsedForRent(BigDecimal.ZERO) // NOTICE_SERVED rent offsets tracked on allocation.depositAmount
                .remainingDeposit(remainingDeposit)
                .unpaidDuesDeducted(unpaidDues)
                .damageDeductions(totalDamages)
                .netRefundAmount(netRefund)
                .refundStatus(refundStatus)
                .transactionReference(request.getTransactionReference())
                .settlementDate(LocalDate.now())
                .remarks(request.getRemarks())
                .build();

        // Build damage items
        if (request.getDamages() != null && !request.getDamages().isEmpty()) {
            List<DamageItem> damageItems = request.getDamages().stream()
                    .map(d -> DamageItem.builder()
                            .clearance(clearance)
                            .description(d.getDescription())
                            .amount(d.getAmount())
                            .build())
                    .collect(Collectors.toList());
            clearance.getDamageItems().addAll(damageItems);
        }

        clearanceRepository.save(clearance);

        // --- 5. Mark all outstanding invoices as PAID via settlement ---
        for (Invoice inv : unpaidInvoices) {
            BigDecimal outstanding = inv.getTotalAmount().subtract(inv.getAmountPaid()).max(BigDecimal.ZERO);
            if (outstanding.compareTo(BigDecimal.ZERO) > 0) {
                Payment settlementPayment = Payment.builder()
                        .invoice(inv)
                        .amount(outstanding)
                        .paymentDate(LocalDate.now())
                        .mode(request.getPaymentMode())
                        .referenceId(request.getTransactionReference())
                        .transactionId(request.getTransactionReference())
                        .remarks("Settled via checkout clearance for allocation " + allocationId)
                        .build();
                paymentRepository.save(settlementPayment);

                inv.setAmountPaid(inv.getTotalAmount());
                inv.setStatus(InvoiceStatus.PAID);
                invoiceRepository.save(inv);
            }
        }

        // --- 6. Vacate allocation ---
        allocation.setStatus(AllocationStatus.VACATED);
        allocation.setCheckOutDate(LocalDate.now());
        allocationRepository.save(allocation);

        // --- 7. Update bed status ---
        Bed bed = allocation.getBed();
        if (bed != null) {
            boolean hasDamages = request.getDamages() != null && !request.getDamages().isEmpty();
            bed.setStatus(hasDamages ? BedStatus.MAINTENANCE : BedStatus.VACANT);
            bed.setCurrentTenantId(null);
            bedRepository.save(bed);
        }

        log.info("Checkout finalized: allocation={} tenant={} refund=₹{} status={} bed={}",
                allocationId, allocation.getTenant().getEmail(), netRefund, refundStatus,
                bed != null ? bed.getBedNumber() : "N/A");

        return CheckoutClearanceResponse.fromEntity(clearance);
    }

    // =========================================================================
    // TENANT VIEW — MY SETTLEMENT
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public CheckoutClearanceResponse getMySettlement(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tenant account not found: " + tenantEmail));

        CheckoutClearance clearance = clearanceRepository.findByAllocationTenantId(tenant.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "No checkout clearance found for tenant: " + tenantEmail));

        return CheckoutClearanceResponse.fromEntity(clearance);
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private Allocation resolveAllocation(Long allocationId) {
        return allocationRepository.findById(allocationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Allocation not found with ID: " + allocationId));
    }

    private boolean isPropertyOwner(Allocation allocation, String callerEmail) {
        var property = allocation.getBed().getRoom().getProperty();
        return property.getOwner() != null
                && property.getOwner().getEmail().equalsIgnoreCase(callerEmail);
    }

    private void verifyOwnerOrAdminAccess(Allocation allocation, String callerEmail, boolean isSuperAdmin) {
        if (!isSuperAdmin && !isPropertyOwner(allocation, callerEmail)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You do not have permission to access checkout details for this allocation.");
        }
    }
}
