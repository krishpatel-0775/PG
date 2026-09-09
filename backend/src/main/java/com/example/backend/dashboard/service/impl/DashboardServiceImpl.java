package com.example.backend.dashboard.service.impl;

import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import com.example.backend.complaintmanagement.repository.ComplaintRepository;
import com.example.backend.dashboard.dto.response.DashboardSummaryResponse;
import com.example.backend.dashboard.service.DashboardService;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

/**
 * Implementation of {@link DashboardService} that aggregates live operational metrics
 * across Bed, Invoice, and Complaint repositories without separate persistence tables.
 */
@Service
@Transactional(readOnly = true)
public class DashboardServiceImpl implements DashboardService {

    private final BedRepository bedRepository;
    private final InvoiceRepository invoiceRepository;
    private final ComplaintRepository complaintRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public DashboardServiceImpl(BedRepository bedRepository,
                                InvoiceRepository invoiceRepository,
                                ComplaintRepository complaintRepository,
                                PropertyRepository propertyRepository,
                                UserRepository userRepository) {
        this.bedRepository = bedRepository;
        this.invoiceRepository = invoiceRepository;
        this.complaintRepository = complaintRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    @Override
    public DashboardSummaryResponse getSummary(Long propertyId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!isSuperAdmin && !property.getOwner().getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view metrics for this property.");
        }

        // 1. Bed counts
        int totalBeds = (int) bedRepository.countByRoomPropertyId(propertyId);
        int occupiedBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.OCCUPIED);
        int vacantBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.VACANT);
        int maintenanceBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.MAINTENANCE);

        // 2. Outstanding rent calculation across active stay invoices
        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);
        BigDecimal totalPendingRent = invoiceRepository.sumOutstandingDuesByPropertyIdAndStatusIn(propertyId, pendingStatuses);
        if (totalPendingRent == null) {
            totalPendingRent = BigDecimal.ZERO;
        }
        int unpaidInvoicesCount = (int) invoiceRepository.countByPropertyIdAndStatusIn(propertyId, pendingStatuses);

        // 3. Current and last month revenue
        YearMonth currentYearMonth = YearMonth.now();
        LocalDate startOfCurrentMonth = currentYearMonth.atDay(1);
        LocalDate endOfCurrentMonth = currentYearMonth.atEndOfMonth();

        YearMonth lastYearMonth = currentYearMonth.minusMonths(1);
        LocalDate startOfLastMonth = lastYearMonth.atDay(1);
        LocalDate endOfLastMonth = lastYearMonth.atEndOfMonth();

        BigDecimal currentMonthRevenue = invoiceRepository.sumAmountPaidByPropertyIdAndInvoiceDateBetween(
                propertyId, startOfCurrentMonth, endOfCurrentMonth);
        if (currentMonthRevenue == null) currentMonthRevenue = BigDecimal.ZERO;

        BigDecimal lastMonthRevenue = invoiceRepository.sumAmountPaidByPropertyIdAndInvoiceDateBetween(
                propertyId, startOfLastMonth, endOfLastMonth);
        if (lastMonthRevenue == null) lastMonthRevenue = BigDecimal.ZERO;

        Double revenueGrowthRate = calculateGrowthRate(currentMonthRevenue, lastMonthRevenue);

        // 4. Maintenance tickets count
        int openComplaints = (int) complaintRepository.countByPropertyIdAndStatus(propertyId, ComplaintStatus.OPEN);
        int inProgressComplaints = (int) complaintRepository.countByPropertyIdAndStatus(propertyId, ComplaintStatus.IN_PROGRESS);
        int resolvedComplaints = (int) complaintRepository.countByPropertyIdAndStatus(propertyId, ComplaintStatus.RESOLVED);

        // 5. Calculate occupancy percentage
        double occupancyRate = calculateOccupancyRate(totalBeds, occupiedBeds);

        return DashboardSummaryResponse.builder()
                .propertyId(property.getId())
                .propertyName(property.getName())
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .vacantBeds(vacantBeds)
                .maintenanceBeds(maintenanceBeds)
                .totalPendingRent(totalPendingRent)
                .unpaidInvoicesCount(unpaidInvoicesCount)
                .currentMonthRevenue(currentMonthRevenue)
                .lastMonthRevenue(lastMonthRevenue)
                .revenueGrowthRate(revenueGrowthRate)
                .openComplaintsCount(openComplaints)
                .inProgressComplaintsCount(inProgressComplaints)
                .resolvedComplaintsCount(resolvedComplaints)
                .occupancyRate(occupancyRate)
                .build();
    }

    @Override
    public DashboardSummaryResponse getOwnerSummary(String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Long ownerId = caller.getId();
        int totalBeds;
        int occupiedBeds;
        int vacantBeds;
        int maintenanceBeds;
        BigDecimal totalPendingRent;
        int unpaidInvoicesCount;
        BigDecimal currentMonthRevenue;
        BigDecimal lastMonthRevenue;
        int openComplaints;
        int inProgressComplaints;
        int resolvedComplaints;

        List<InvoiceStatus> pendingStatuses = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

        YearMonth currentYearMonth = YearMonth.now();
        LocalDate startOfCurrentMonth = currentYearMonth.atDay(1);
        LocalDate endOfCurrentMonth = currentYearMonth.atEndOfMonth();

        YearMonth lastYearMonth = currentYearMonth.minusMonths(1);
        LocalDate startOfLastMonth = lastYearMonth.atDay(1);
        LocalDate endOfLastMonth = lastYearMonth.atEndOfMonth();

        if (isSuperAdmin) {
            totalBeds = (int) bedRepository.count();
            occupiedBeds = (int) bedRepository.countAllByStatus(BedStatus.OCCUPIED);
            vacantBeds = (int) bedRepository.countAllByStatus(BedStatus.VACANT);
            maintenanceBeds = (int) bedRepository.countAllByStatus(BedStatus.MAINTENANCE);

            totalPendingRent = invoiceRepository.sumOutstandingDuesAllAndStatusIn(pendingStatuses);
            unpaidInvoicesCount = (int) invoiceRepository.countAllByStatusIn(pendingStatuses);

            currentMonthRevenue = invoiceRepository.sumAmountPaidAllAndInvoiceDateBetween(startOfCurrentMonth, endOfCurrentMonth);
            lastMonthRevenue = invoiceRepository.sumAmountPaidAllAndInvoiceDateBetween(startOfLastMonth, endOfLastMonth);

            openComplaints = (int) complaintRepository.countByStatus(ComplaintStatus.OPEN);
            inProgressComplaints = (int) complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
            resolvedComplaints = (int) complaintRepository.countByStatus(ComplaintStatus.RESOLVED);
        } else {
            totalBeds = (int) bedRepository.countByRoomPropertyOwnerId(ownerId);
            occupiedBeds = (int) bedRepository.countByRoomPropertyOwnerIdAndStatus(ownerId, BedStatus.OCCUPIED);
            vacantBeds = (int) bedRepository.countByRoomPropertyOwnerIdAndStatus(ownerId, BedStatus.VACANT);
            maintenanceBeds = (int) bedRepository.countByRoomPropertyOwnerIdAndStatus(ownerId, BedStatus.MAINTENANCE);

            totalPendingRent = invoiceRepository.sumOutstandingDuesByOwnerIdAndStatusIn(ownerId, pendingStatuses);
            unpaidInvoicesCount = (int) invoiceRepository.countByOwnerIdAndStatusIn(ownerId, pendingStatuses);

            currentMonthRevenue = invoiceRepository.sumAmountPaidByOwnerIdAndInvoiceDateBetween(ownerId, startOfCurrentMonth, endOfCurrentMonth);
            lastMonthRevenue = invoiceRepository.sumAmountPaidByOwnerIdAndInvoiceDateBetween(ownerId, startOfLastMonth, endOfLastMonth);

            openComplaints = (int) complaintRepository.countByPropertyOwnerIdAndStatus(ownerId, ComplaintStatus.OPEN);
            inProgressComplaints = (int) complaintRepository.countByPropertyOwnerIdAndStatus(ownerId, ComplaintStatus.IN_PROGRESS);
            resolvedComplaints = (int) complaintRepository.countByPropertyOwnerIdAndStatus(ownerId, ComplaintStatus.RESOLVED);
        }

        if (totalPendingRent == null) totalPendingRent = BigDecimal.ZERO;
        if (currentMonthRevenue == null) currentMonthRevenue = BigDecimal.ZERO;
        if (lastMonthRevenue == null) lastMonthRevenue = BigDecimal.ZERO;

        Double revenueGrowthRate = calculateGrowthRate(currentMonthRevenue, lastMonthRevenue);
        double occupancyRate = calculateOccupancyRate(totalBeds, occupiedBeds);

        return DashboardSummaryResponse.builder()
                .propertyId(null)
                .propertyName(isSuperAdmin ? "All Properties (System)" : "All Properties (" + caller.getName() + ")")
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .vacantBeds(vacantBeds)
                .maintenanceBeds(maintenanceBeds)
                .totalPendingRent(totalPendingRent)
                .unpaidInvoicesCount(unpaidInvoicesCount)
                .currentMonthRevenue(currentMonthRevenue)
                .lastMonthRevenue(lastMonthRevenue)
                .revenueGrowthRate(revenueGrowthRate)
                .openComplaintsCount(openComplaints)
                .inProgressComplaintsCount(inProgressComplaints)
                .resolvedComplaintsCount(resolvedComplaints)
                .occupancyRate(occupancyRate)
                .build();
    }

    private Double calculateGrowthRate(BigDecimal current, BigDecimal last) {
        if (last != null && last.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal diff = current.subtract(last);
            return diff.divide(last, 4, RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        } else if (current != null && current.compareTo(BigDecimal.ZERO) > 0) {
            return 100.0;
        }
        return 0.0;
    }

    private double calculateOccupancyRate(int totalBeds, int occupiedBeds) {
        if (totalBeds > 0) {
            return BigDecimal.valueOf((double) occupiedBeds / totalBeds * 100.0)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }
        return 0.0;
    }
}
