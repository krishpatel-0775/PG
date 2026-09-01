package com.example.backend.analytics.service.impl;

import com.example.backend.analytics.dto.ComplaintDataDTO;
import com.example.backend.analytics.dto.OccupancyDataDTO;
import com.example.backend.analytics.dto.PropertyAnalyticsResponse;
import com.example.backend.analytics.dto.RevenueDataDTO;
import com.example.backend.analytics.service.AnalyticsService;
import com.example.backend.complaintmanagement.entity.Complaint;
import com.example.backend.complaintmanagement.entity.ComplaintCategory;
import com.example.backend.complaintmanagement.repository.ComplaintRepository;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementation of {@link AnalyticsService} providing visual dashboard metrics,
 * historical revenue tracking, occupancy states, complaint breakdown, and tenant check-in velocity.
 */
@Service
@Transactional(readOnly = true)
public class AnalyticsServiceImpl implements AnalyticsService {

    private static final DateTimeFormatter MONTH_LABEL_FORMATTER = DateTimeFormatter.ofPattern("MMM yyyy");

    private final PropertyRepository propertyRepository;
    private final BedRepository bedRepository;
    private final InvoiceRepository invoiceRepository;
    private final ComplaintRepository complaintRepository;
    private final AllocationRepository allocationRepository;
    private final UserRepository userRepository;

    public AnalyticsServiceImpl(PropertyRepository propertyRepository,
                                BedRepository bedRepository,
                                InvoiceRepository invoiceRepository,
                                ComplaintRepository complaintRepository,
                                AllocationRepository allocationRepository,
                                UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.bedRepository = bedRepository;
        this.invoiceRepository = invoiceRepository;
        this.complaintRepository = complaintRepository;
        this.allocationRepository = allocationRepository;
        this.userRepository = userRepository;
    }

    @Override
    public PropertyAnalyticsResponse getPropertyAnalytics(Long propertyId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        // Ownership authorization check
        if (!isSuperAdmin && !property.getOwner().getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view analytics for this property.");
        }

        // 1. Current Bed Occupancy Statuses
        int occupiedBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.OCCUPIED);
        int vacantBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.VACANT);
        int maintenanceBeds = (int) bedRepository.countByRoomPropertyIdAndStatus(propertyId, BedStatus.MAINTENANCE);

        OccupancyDataDTO occupancyData = OccupancyDataDTO.builder()
                .occupied(occupiedBeds)
                .vacant(vacantBeds)
                .maintenance(maintenanceBeds)
                .build();

        // 2. 6-Month Historical Revenue Trend (Past 5 months + Current month)
        YearMonth currentYearMonth = YearMonth.now();
        List<RevenueDataDTO> revenueTrend = new ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            YearMonth ym = currentYearMonth.minusMonths(i);
            LocalDate startOfMonth = ym.atDay(1);
            LocalDate endOfMonth = ym.atEndOfMonth();
            String monthLabel = ym.format(MONTH_LABEL_FORMATTER);

            BigDecimal collected = invoiceRepository.sumAmountPaidByPropertyIdAndInvoiceDateBetween(propertyId, startOfMonth, endOfMonth);
            BigDecimal pending = invoiceRepository.sumOutstandingByPropertyIdAndInvoiceDateBetween(propertyId, startOfMonth, endOfMonth);

            revenueTrend.add(RevenueDataDTO.builder()
                    .month(monthLabel)
                    .collected(collected != null ? collected : BigDecimal.ZERO)
                    .pending(pending != null ? pending : BigDecimal.ZERO)
                    .build());
        }

        // 3. Complaints Breakdown by Category
        List<Complaint> complaints = complaintRepository.findByPropertyId(propertyId);
        Map<String, Integer> categoryCounts = new LinkedHashMap<>();
        for (ComplaintCategory category : ComplaintCategory.values()) {
            categoryCounts.put(category.name(), 0);
        }
        for (Complaint complaint : complaints) {
            if (complaint.getCategory() != null) {
                String catName = complaint.getCategory().name();
                categoryCounts.put(catName, categoryCounts.getOrDefault(catName, 0) + 1);
            }
        }

        List<ComplaintDataDTO> complaintsByCategory = categoryCounts.entrySet().stream()
                .map(entry -> ComplaintDataDTO.builder()
                        .category(entry.getKey())
                        .count(entry.getValue())
                        .build())
                .collect(Collectors.toList());

        // 4. New Tenant Check-ins in the Current Month
        LocalDate startOfCurrentMonth = currentYearMonth.atDay(1);
        LocalDate endOfCurrentMonth = currentYearMonth.atEndOfMonth();
        int newCheckIns = (int) allocationRepository.countByBedRoomPropertyIdAndCheckInDateBetween(
                propertyId, startOfCurrentMonth, endOfCurrentMonth);

        // 5. Total Expected Billing for the Current Month
        BigDecimal currentMonthExpected = invoiceRepository.sumTotalAmountByPropertyIdAndInvoiceDateBetween(
                propertyId, startOfCurrentMonth, endOfCurrentMonth);

        if (currentMonthExpected == null || currentMonthExpected.compareTo(BigDecimal.ZERO) == 0) {
            currentMonthExpected = allocationRepository.sumMonthlyRentByPropertyIdAndStatus(
                    propertyId, AllocationStatus.ACTIVE);
        }
        if (currentMonthExpected == null) {
            currentMonthExpected = BigDecimal.ZERO;
        }

        return PropertyAnalyticsResponse.builder()
                .sixMonthRevenueTrend(revenueTrend)
                .currentOccupancy(occupancyData)
                .complaintsByCategory(complaintsByCategory)
                .currentMonthTotalExpected(currentMonthExpected)
                .newCheckInsThisMonth(newCheckIns)
                .build();
    }
}
