package com.example.backend.tenantmanagement.service.impl;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.tenantmanagement.dto.response.TenantInvoiceDTO;
import com.example.backend.tenantmanagement.dto.response.TenantListResponse;
import com.example.backend.tenantmanagement.dto.response.TenantProfileResponse;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.tenantmanagement.service.TenantDirectoryService;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
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
 * Implementation of {@link TenantDirectoryService} providing PG Owner CRM profile views,
 * tenant listing with sorting, authorization checks, and financial history aggregation.
 */
@Service
@Transactional(readOnly = true)
public class TenantDirectoryServiceImpl implements TenantDirectoryService {

    private final AllocationRepository allocationRepository;
    private final UserRepository userRepository;
    private final InvoiceRepository invoiceRepository;

    public TenantDirectoryServiceImpl(AllocationRepository allocationRepository,
                                      UserRepository userRepository,
                                      InvoiceRepository invoiceRepository) {
        this.allocationRepository = allocationRepository;
        this.userRepository = userRepository;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Fetches all allocations for properties owned by the authenticated PG Owner (or all for SUPER_ADMIN).
     * Maps to TenantListResponse and sorts active tenants first, then by latest check-in date.
     */
    @Override
    public List<TenantListResponse> getAllTenantsForOwner(String ownerEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + ownerEmail));

        List<Allocation> allocations = isSuperAdmin
                ? new ArrayList<>(allocationRepository.findAll())
                : new ArrayList<>(allocationRepository.findByBedRoomPropertyOwnerId(caller.getId()));

        // Sort active allocations first, then by check-in date descending
        allocations.sort((a, b) -> {
            boolean aActive = a.getStatus() == AllocationStatus.ACTIVE;
            boolean bActive = b.getStatus() == AllocationStatus.ACTIVE;
            if (aActive != bActive) {
                return aActive ? -1 : 1;
            }
            if (a.getCheckInDate() != null && b.getCheckInDate() != null) {
                return b.getCheckInDate().compareTo(a.getCheckInDate());
            }
            return 0;
        });

        return allocations.stream().map(allocation -> {
            User tenant = allocation.getTenant();
            var bed = allocation.getBed();
            var room = bed != null ? bed.getRoom() : null;
            var property = room != null ? room.getProperty() : null;

            String roomNum = room != null ? room.getRoomNumber() : "-";
            String bedNum = bed != null ? bed.getBedNumber() : "-";
            String currentRoomBed = String.format("Room %s • Bed %s", roomNum, bedNum);
            String propertyName = property != null ? property.getName() : "N/A";

            return TenantListResponse.builder()
                    .tenantId(tenant != null ? tenant.getId() : null)
                    .name(tenant != null ? tenant.getName() : "Unknown Tenant")
                    .phone(tenant != null ? tenant.getPhone() : null)
                    .email(tenant != null ? tenant.getEmail() : null)
                    .currentPropertyName(propertyName)
                    .currentRoomBed(currentRoomBed)
                    .checkInDate(allocation.getCheckInDate())
                    .allocationStatus(allocation.getStatus() != null ? allocation.getStatus().name() : "N/A")
                    .build();
        }).collect(Collectors.toList());
    }

    /**
     * Verifies that the PG Owner has management rights for this tenant, then fetches their CRM profile
     * with personal info, stay allocation details, and historical invoices.
     */
    @Override
    public TenantProfileResponse getTenantProfileForOwner(Long tenantId, String ownerEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + ownerEmail));

        // Security check: verify owner owns at least one allocation for this tenant
        if (!isSuperAdmin) {
            boolean hasAllocation = allocationRepository.existsByTenantIdAndBedRoomPropertyOwnerId(tenantId, caller.getId());
            if (!hasAllocation) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view profile for this tenant.");
            }
        }

        // Fetch Tenant User
        User tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant account not found with ID: " + tenantId));

        // Fetch allocations for this tenant (ordered by newest check-in date)
        List<Allocation> tenantAllocations = allocationRepository.findByTenantIdOrderByCheckInDateDesc(tenantId);

        // Prioritize ACTIVE allocation if available, otherwise latest allocation
        Allocation primaryAllocation = tenantAllocations.stream()
                .filter(a -> a.getStatus() == AllocationStatus.ACTIVE)
                .findFirst()
                .orElse(tenantAllocations.isEmpty() ? null : tenantAllocations.get(0));

        // Fetch all billing invoices for this tenant
        List<Invoice> invoices = invoiceRepository.findByAllocationTenantId(tenantId);
        List<TenantInvoiceDTO> invoiceDTOs = invoices.stream()
                .sorted((i1, i2) -> {
                    if (i1.getInvoiceDate() != null && i2.getInvoiceDate() != null) {
                        return i2.getInvoiceDate().compareTo(i1.getInvoiceDate());
                    }
                    return Long.compare(i2.getId() != null ? i2.getId() : 0, i1.getId() != null ? i1.getId() : 0);
                })
                .map(TenantInvoiceDTO::fromEntity)
                .collect(Collectors.toList());

        // Extract stay details
        String propertyName = null;
        String roomNumber = null;
        String bedNumber = null;
        LocalDate checkInDate = null;
        LocalDate checkOutDate = null;
        BigDecimal depositAmount = null;
        BigDecimal monthlyRent = null;
        String allocationStatus = null;

        if (primaryAllocation != null) {
            var bed = primaryAllocation.getBed();
            var room = bed != null ? bed.getRoom() : null;
            var property = room != null ? room.getProperty() : null;

            propertyName = property != null ? property.getName() : null;
            roomNumber = room != null ? room.getRoomNumber() : null;
            bedNumber = bed != null ? bed.getBedNumber() : null;
            checkInDate = primaryAllocation.getCheckInDate();
            checkOutDate = primaryAllocation.getCheckOutDate();
            depositAmount = primaryAllocation.getDepositAmount();
            monthlyRent = primaryAllocation.getMonthlyRent();
            allocationStatus = primaryAllocation.getStatus() != null ? primaryAllocation.getStatus().name() : null;
        }

        return TenantProfileResponse.builder()
                .tenantId(tenant.getId())
                .name(tenant.getName())
                .phone(tenant.getPhone())
                .email(tenant.getEmail())
                .isShadowUser(tenant.isShadowUser())
                .propertyName(propertyName)
                .roomNumber(roomNumber)
                .bedNumber(bedNumber)
                .checkInDate(checkInDate)
                .checkOutDate(checkOutDate)
                .depositAmount(depositAmount)
                .monthlyRent(monthlyRent)
                .allocationStatus(allocationStatus)
                .financialHistory(invoiceDTOs)
                .build();
    }
}
