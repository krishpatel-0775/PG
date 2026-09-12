package com.example.backend.financemanagement.service.impl;

import com.example.backend.financemanagement.dto.request.UtilityBillingRequest;
import com.example.backend.financemanagement.dto.response.*;
import com.example.backend.financemanagement.entity.*;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.financemanagement.repository.UtilityShareRepository;
import com.example.backend.financemanagement.service.UtilityBillingService;
import com.example.backend.propertymanagement.entity.MeterReading;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.MeterReadingRepository;
import com.example.backend.propertymanagement.repository.RoomRepository;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

/**
 * Implementation of {@link UtilityBillingService} providing the two-phase preview/commit
 * prorated electricity billing workflow.
 *
 * <p><b>Proration algorithm</b> (per spec):
 * <ol>
 *   <li>Base share per bed = totalRoomCost / room.totalCapacity</li>
 *   <li>Days occupied = min(billingMonthEnd, checkoutDate) − max(billingMonthStart, checkInDate) + 1</li>
 *   <li>Full month → tenantShare = baseShare</li>
 *   <li>Partial month → tenantShare = (baseShare / totalDaysInMonth) * daysOccupied</li>
 *   <li>Vacant beds and unoccupied fractional days are owner-absorbed</li>
 * </ol>
 */
@Service
@Transactional
public class UtilityBillingServiceImpl implements UtilityBillingService {

    private static final Logger log = LoggerFactory.getLogger(UtilityBillingServiceImpl.class);

    /**
     * Billing month format: "SEP-2026" / "sep-2026" / "Sep-2026" (case-insensitive, Locale.ENGLISH).
     * Uses parseCaseInsensitive() so all-caps input like "SEP-2026" is accepted correctly
     * regardless of JVM locale or DateTimeFormatter symbol-resolver behaviour.
     */
    private static final DateTimeFormatter BILLING_MONTH_FORMATTER =
            new java.time.format.DateTimeFormatterBuilder()
                    .parseCaseInsensitive()
                    .appendPattern("MMM-yyyy")
                    .toFormatter(Locale.ENGLISH);

    /** Statuses considered "active" for utility billing (deposit-offset tenants also get utility bills). */
    private static final List<AllocationStatus> BILLABLE_STATUSES =
            List.of(AllocationStatus.ACTIVE, AllocationStatus.NOTICE_SERVED);

    private final RoomRepository roomRepository;
    private final MeterReadingRepository meterReadingRepository;
    private final AllocationRepository allocationRepository;
    private final UtilityShareRepository utilityShareRepository;
    private final InvoiceRepository invoiceRepository;
    private final UserRepository userRepository;

    public UtilityBillingServiceImpl(RoomRepository roomRepository,
                                     MeterReadingRepository meterReadingRepository,
                                     AllocationRepository allocationRepository,
                                     UtilityShareRepository utilityShareRepository,
                                     InvoiceRepository invoiceRepository,
                                     UserRepository userRepository) {
        this.roomRepository = roomRepository;
        this.meterReadingRepository = meterReadingRepository;
        this.allocationRepository = allocationRepository;
        this.utilityShareRepository = utilityShareRepository;
        this.invoiceRepository = invoiceRepository;
        this.userRepository = userRepository;
    }

    // =========================================================================
    // PREVIEW — no DB writes
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public UtilityPreviewResponse previewUtilityBilling(UtilityBillingRequest request) {
        Room room = resolveRoom(request.getRoomId());
        String billingMonthNorm = request.getBillingMonth().toUpperCase(Locale.ENGLISH);
        YearMonth billingYearMonth = parseBillingMonth(billingMonthNorm);
        BigDecimal previousReading = resolvePreviousReading(room, request);

        validateCurrentReading(request.getCurrentReading(), previousReading, billingMonthNorm);

        BigDecimal unitsConsumed = request.getCurrentReading().subtract(previousReading)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalRoomCost = unitsConsumed.multiply(request.getRatePerUnit())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseSharePerBed = computeBaseShare(room, totalRoomCost);

        List<Allocation> allocations = getAllocationsForRoom(room.getId());
        List<TenantSharePreview> tenantShares = computeTenantSharePreviews(
                allocations, billingYearMonth, baseSharePerBed);

        BigDecimal totalTenantShare = tenantShares.stream()
                .map(TenantSharePreview::getShareAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal ownerAbsorbed = totalRoomCost.subtract(totalTenantShare).max(BigDecimal.ZERO);

        log.info("PREVIEW room={} month={}: units={}, total=₹{}, tenants={}, ownerAbsorbs=₹{}",
                room.getId(), billingMonthNorm, unitsConsumed, totalRoomCost,
                tenantShares.size(), ownerAbsorbed);

        return UtilityPreviewResponse.builder()
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .billingMonth(billingMonthNorm)
                .previousReading(previousReading)
                .currentReading(request.getCurrentReading())
                .unitsConsumed(unitsConsumed)
                .ratePerUnit(request.getRatePerUnit())
                .totalRoomCost(totalRoomCost)
                .baseSharePerBed(baseSharePerBed)
                .totalTenantShareAmount(totalTenantShare)
                .ownerAbsorbedAmount(ownerAbsorbed)
                .tenantShares(tenantShares)
                .build();
    }

    // =========================================================================
    // COMMIT — persists MeterReading → UtilityShare → Invoice per tenant
    // =========================================================================

    @Override
    @Transactional
    public UtilityCommitResponse commitUtilityBilling(UtilityBillingRequest request,
                                                      String callerEmail,
                                                      boolean isSuperAdmin) {
        Room room = resolveRoom(request.getRoomId());
        String billingMonthNorm = request.getBillingMonth().toUpperCase(Locale.ENGLISH);
        YearMonth billingYearMonth = parseBillingMonth(billingMonthNorm);

        // Guard: prevent duplicate billing for the same room + billing month
        if (meterReadingRepository.existsByRoomIdAndBillingMonth(room.getId(), billingMonthNorm)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Utility billing for room '" + room.getRoomNumber() + "' in " + billingMonthNorm
                            + " has already been committed. Use history endpoint to review.");
        }

        BigDecimal previousReading = resolvePreviousReading(room, request);
        validateCurrentReading(request.getCurrentReading(), previousReading, billingMonthNorm);

        BigDecimal unitsConsumed = request.getCurrentReading().subtract(previousReading)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal totalRoomCost = unitsConsumed.multiply(request.getRatePerUnit())
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal baseSharePerBed = computeBaseShare(room, totalRoomCost);

        // 1. Persist MeterReading
        MeterReading meterReading = meterReadingRepository.save(MeterReading.builder()
                .room(room)
                .previousReading(previousReading)
                .currentReading(request.getCurrentReading())
                .unitsConsumed(unitsConsumed)
                .ratePerUnit(request.getRatePerUnit())
                .totalAmount(totalRoomCost)
                .billingMonth(billingMonthNorm)
                .readingDate(LocalDate.now())
                .build());

        // 2. Compute tenant shares
        List<Allocation> allocations = getAllocationsForRoom(room.getId());
        List<TenantSharePreview> previews = computeTenantSharePreviews(allocations, billingYearMonth, baseSharePerBed);

        LocalDate dueDate = LocalDate.now().plusDays(5);
        List<UtilityShareResponse> shareResponses = new ArrayList<>();
        BigDecimal totalTenantShare = BigDecimal.ZERO;

        // 3. For each tenant share: create Invoice → persist UtilityShare
        for (int i = 0; i < allocations.size() && i < previews.size(); i++) {
            Allocation allocation = allocations.get(i);
            TenantSharePreview preview = previews.get(i);

            // Match preview to allocation (same order from computeTenantSharePreviews)
            if (!allocation.getId().equals(preview.getAllocationId())) {
                // Safety alignment check — skip mismatched
                log.warn("Skipping mismatched allocation {} vs preview allocationId {}", allocation.getId(), preview.getAllocationId());
                continue;
            }

            Invoice utilityInvoice = invoiceRepository.save(Invoice.builder()
                    .allocation(allocation)
                    .invoiceType(InvoiceType.UTILITY)
                    .invoiceDate(LocalDate.now())
                    .dueDate(dueDate)
                    .totalAmount(preview.getShareAmount())
                    .amountPaid(BigDecimal.ZERO)
                    .status(InvoiceStatus.UNPAID)
                    .invoiceMonth(billingMonthNorm)
                    .build());

            UtilityShare share = utilityShareRepository.save(UtilityShare.builder()
                    .meterReading(meterReading)
                    .allocation(allocation)
                    .tenant(allocation.getTenant())
                    .daysOccupied(preview.getDaysOccupied())
                    .totalDaysInMonth(preview.getTotalDaysInMonth())
                    .shareAmount(preview.getShareAmount())
                    .invoice(utilityInvoice)
                    .status(UtilityShareStatus.BILLED)
                    .build());

            totalTenantShare = totalTenantShare.add(preview.getShareAmount());

            log.info("COMMIT utility share: tenant={} allocation={} amount=₹{} days={}/{} month={}",
                    allocation.getTenant().getEmail(), allocation.getId(),
                    preview.getShareAmount(), preview.getDaysOccupied(), preview.getTotalDaysInMonth(), billingMonthNorm);

            shareResponses.add(buildShareResponse(share, meterReading));
        }

        BigDecimal ownerAbsorbed = totalRoomCost.subtract(totalTenantShare).max(BigDecimal.ZERO);

        return UtilityCommitResponse.builder()
                .meterReadingId(meterReading.getId())
                .roomId(room.getId())
                .roomNumber(room.getRoomNumber())
                .billingMonth(billingMonthNorm)
                .unitsConsumed(unitsConsumed)
                .totalRoomCost(totalRoomCost)
                .ownerAbsorbedAmount(ownerAbsorbed)
                .readingDate(meterReading.getReadingDate())
                .invoicesGenerated(shareResponses.size())
                .tenantShares(shareResponses)
                .build();
    }

    // =========================================================================
    // HISTORY & TENANT VIEW
    // =========================================================================

    @Override
    @Transactional(readOnly = true)
    public List<MeterReadingResponse> getRoomMeterHistory(Long roomId, String callerEmail, boolean isSuperAdmin) {
        if (!roomRepository.existsById(roomId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found with ID: " + roomId);
        }
        return meterReadingRepository.findByRoomIdOrderByReadingDateDesc(roomId).stream()
                .map(MeterReadingResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<UtilityShareResponse> getMyUtilityShares(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Tenant account not found: " + tenantEmail));

        return utilityShareRepository.findByTenantId(tenant.getId()).stream()
                .map(share -> buildShareResponse(share, share.getMeterReading()))
                .collect(Collectors.toList());
    }

    // =========================================================================
    // PRIVATE HELPERS
    // =========================================================================

    private Room resolveRoom(Long roomId) {
        // JOIN FETCH the beds collection so that room.getBeds().size() is accurate
        // when computing capacity in computeBaseShare — findById() returns a lazy proxy
        // whose beds list is always empty inside a read-only transaction.
        return roomRepository.findByIdWithBeds(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Room not found with ID: " + roomId));
    }

    /**
     * Parses a billing month string into {@link YearMonth}.
     * Accepts any case: "SEP-2026", "sep-2026", "Sep-2026" are all valid.
     */
    private YearMonth parseBillingMonth(String billingMonth) {
        try {
            return YearMonth.parse(billingMonth.strip(), BILLING_MONTH_FORMATTER);
        } catch (DateTimeParseException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Invalid billingMonth format '" + billingMonth + "'. Expected: SEP-2026");
        }
    }

    /**
     * Resolves the previous meter reading from the request override or the latest DB record for this room.
     * Defaults to 0 if no prior reading exists.
     */
    private BigDecimal resolvePreviousReading(Room room, UtilityBillingRequest request) {
        if (request.getPreviousReading() != null) {
            return request.getPreviousReading();
        }
        return meterReadingRepository.findTopByRoomIdOrderByReadingDateDesc(room.getId())
                .map(MeterReading::getCurrentReading)
                .orElse(BigDecimal.ZERO);
    }

    private void validateCurrentReading(BigDecimal current, BigDecimal previous, String billingMonth) {
        if (current.compareTo(previous) < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    String.format("currentReading (%s) cannot be less than previousReading (%s) for %s.",
                            current.toPlainString(), previous.toPlainString(), billingMonth));
        }
    }

    /**
     * Computes base share per bed = totalRoomCost / roomCapacity.
     *
     * <p>Capacity resolution order:
     * <ol>
     *   <li>Actual number of {@link com.example.backend.propertymanagement.entity.Bed} records
     *       in the room (fetched via JOIN FETCH — always authoritative).</li>
     *   <li>{@link Room#getTotalCapacity()} if the DB column is populated and positive.</li>
     *   <li>Fallback: 1 (bill stays at full room cost — should never happen in production).</li>
     * </ol>
     */
    private BigDecimal computeBaseShare(Room room, BigDecimal totalRoomCost) {
        // Prefer actual bed count: room was loaded with JOIN FETCH so this list is initialised.
        int capacity = (room.getBeds() != null && !room.getBeds().isEmpty())
                ? room.getBeds().size()
                : (room.getTotalCapacity() != null && room.getTotalCapacity() > 0
                        ? room.getTotalCapacity()
                        : 1);
        log.debug("computeBaseShare: room={} capacity={} totalRoomCost={}",
                room.getId(), capacity, totalRoomCost);
        return totalRoomCost.divide(BigDecimal.valueOf(capacity), 2, RoundingMode.HALF_UP);
    }

    /**
     * Returns all ACTIVE and NOTICE_SERVED allocations for beds in the specified room.
     */
    private List<Allocation> getAllocationsForRoom(Long roomId) {
        return allocationRepository.findByStatusIn(BILLABLE_STATUSES).stream()
                .filter(a -> a.getBed() != null
                        && a.getBed().getRoom() != null
                        && a.getBed().getRoom().getId().equals(roomId))
                .collect(Collectors.toList());
    }

    /**
     * Computes prorated share previews for each allocation.
     * Maintains the same ordering as the input {@code allocations} list.
     */
    private List<TenantSharePreview> computeTenantSharePreviews(List<Allocation> allocations,
                                                                  YearMonth billingYearMonth,
                                                                  BigDecimal baseSharePerBed) {
        LocalDate billingMonthStart = billingYearMonth.atDay(1);
        LocalDate billingMonthEnd = billingYearMonth.atEndOfMonth();
        int totalDaysInMonth = billingYearMonth.lengthOfMonth();

        List<TenantSharePreview> results = new ArrayList<>();

        for (Allocation allocation : allocations) {
            User tenant = allocation.getTenant();
            var bed = allocation.getBed();

            // Effective start: latest of allocation check-in and billing month start
            LocalDate effectiveStart = allocation.getCheckInDate().isAfter(billingMonthStart)
                    ? allocation.getCheckInDate() : billingMonthStart;

            // Effective end: earliest of tenant checkout (or planned checkout) and billing month end
            LocalDate checkoutBoundary = resolveCheckoutBoundary(allocation, billingMonthEnd);
            LocalDate effectiveEnd = checkoutBoundary.isBefore(billingMonthEnd)
                    ? checkoutBoundary : billingMonthEnd;

            long daysOccupiedLong = effectiveEnd.toEpochDay() - effectiveStart.toEpochDay() + 1;
            if (daysOccupiedLong <= 0) {
                // Tenant was not present during this billing month — skip; cost absorbed by owner
                log.debug("Allocation {} not present in billing month — skipping", allocation.getId());
                continue;
            }

            int daysOccupied = (int) Math.min(daysOccupiedLong, totalDaysInMonth);
            boolean fullMonthOccupied = (daysOccupied >= totalDaysInMonth);

            BigDecimal shareAmount;
            if (fullMonthOccupied) {
                shareAmount = baseSharePerBed;
            } else {
                // Prorated: (baseShare / totalDaysInMonth) * daysOccupied — uses spec formula
                shareAmount = baseSharePerBed
                        .divide(BigDecimal.valueOf(totalDaysInMonth), 6, RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(daysOccupied))
                        .setScale(2, RoundingMode.HALF_UP);
            }

            results.add(TenantSharePreview.builder()
                    .tenantId(tenant.getId())
                    .tenantName(tenant.getName())
                    .tenantEmail(tenant.getEmail())
                    .allocationId(allocation.getId())
                    .bedId(bed != null ? bed.getId() : null)
                    .bedNumber(bed != null ? bed.getBedNumber() : null)
                    .daysOccupied(daysOccupied)
                    .totalDaysInMonth(totalDaysInMonth)
                    .fullMonthOccupied(fullMonthOccupied)
                    .shareAmount(shareAmount)
                    .build());
        }

        return results;
    }

    /**
     * Determines the effective last day the tenant occupied the bed.
     * For NOTICE_SERVED tenants, uses plannedCheckoutDate if before month end.
     */
    private LocalDate resolveCheckoutBoundary(Allocation allocation, LocalDate billingMonthEnd) {
        // Actual checkout date takes priority
        if (allocation.getCheckOutDate() != null) {
            return allocation.getCheckOutDate();
        }
        // For notice-served tenants, cap at planned checkout if within the billing month
        if (allocation.getStatus() == AllocationStatus.NOTICE_SERVED
                && allocation.getPlannedCheckoutDate() != null
                && allocation.getPlannedCheckoutDate().isBefore(billingMonthEnd)) {
            return allocation.getPlannedCheckoutDate();
        }
        return billingMonthEnd;
    }

    private UtilityShareResponse buildShareResponse(UtilityShare share, MeterReading meterReading) {
        var allocation = share.getAllocation();
        var tenant = share.getTenant();
        var bed = allocation != null ? allocation.getBed() : null;
        var room = bed != null ? bed.getRoom() : (meterReading != null ? meterReading.getRoom() : null);
        Integer capacity = room != null ? (room.getTotalCapacity() != null ? room.getTotalCapacity() : (room.getBeds() != null ? room.getBeds().size() : 1)) : 1;
        String roomNum = room != null ? room.getRoomNumber() : (meterReading != null && meterReading.getRoom() != null ? meterReading.getRoom().getRoomNumber() : null);

        return UtilityShareResponse.builder()
                .id(share.getId())
                .meterReadingId(meterReading != null ? meterReading.getId() : null)
                .billingMonth(meterReading != null ? meterReading.getBillingMonth() : null)
                .allocationId(allocation != null ? allocation.getId() : null)
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(tenant != null ? tenant.getName() : null)
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .bedId(bed != null ? bed.getId() : null)
                .bedNumber(bed != null ? bed.getBedNumber() : null)
                .roomNumber(roomNum)
                .roomCapacity(capacity)
                .previousReading(meterReading != null ? meterReading.getPreviousReading() : null)
                .currentReading(meterReading != null ? meterReading.getCurrentReading() : null)
                .unitsConsumed(meterReading != null ? meterReading.getUnitsConsumed() : null)
                .ratePerUnit(meterReading != null ? meterReading.getRatePerUnit() : null)
                .totalRoomCost(meterReading != null ? meterReading.getTotalAmount() : null)
                .daysOccupied(share.getDaysOccupied())
                .totalDaysInMonth(share.getTotalDaysInMonth())
                .shareAmount(share.getShareAmount())
                .status(share.getStatus())
                .invoiceId(share.getInvoice() != null ? share.getInvoice().getId() : null)
                .invoiceDueDate(share.getInvoice() != null ? share.getInvoice().getDueDate() : null)
                .build();
    }
}
