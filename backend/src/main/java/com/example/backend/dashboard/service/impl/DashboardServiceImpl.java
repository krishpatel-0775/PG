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

        // 3. Open maintenance tickets count
        int openComplaints = (int) complaintRepository.countByPropertyIdAndStatus(propertyId, ComplaintStatus.OPEN);

        // 4. Calculate occupancy percentage
        double occupancyRate = 0.0;
        if (totalBeds > 0) {
            occupancyRate = BigDecimal.valueOf((double) occupiedBeds / totalBeds * 100.0)
                    .setScale(1, RoundingMode.HALF_UP)
                    .doubleValue();
        }

        return DashboardSummaryResponse.builder()
                .propertyId(property.getId())
                .propertyName(property.getName())
                .totalBeds(totalBeds)
                .occupiedBeds(occupiedBeds)
                .vacantBeds(vacantBeds)
                .maintenanceBeds(maintenanceBeds)
                .totalPendingRent(totalPendingRent)
                .openComplaintsCount(openComplaints)
                .occupancyRate(occupancyRate)
                .build();
    }
}
