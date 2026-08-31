package com.example.backend.tenantmanagement.service.impl;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.tenantmanagement.dto.request.CreateAllocationRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.tenantmanagement.service.AllocationService;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Implementation of {@link AllocationService} managing tenant check-in, phone-based shadow user creation,
 * lease state, and check-out.
 */
@Service
@Transactional
public class AllocationServiceImpl implements AllocationService {

    private final AllocationRepository allocationRepository;
    private final BedRepository bedRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public AllocationServiceImpl(AllocationRepository allocationRepository,
                                 BedRepository bedRepository,
                                 UserRepository userRepository,
                                 PasswordEncoder passwordEncoder) {
        this.allocationRepository = allocationRepository;
        this.bedRepository = bedRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Allocates a vacant bed to a tenant by Mobile Phone number. If the tenant does not yet have an account,
     * automatically provisions a Shadow User with a temporary random password and generated temporary email.
     */
    @Override
    public AllocationResponse allocateBed(CreateAllocationRequest request, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        String tenantPhone = request.getTenantPhone().trim();

        // 1. Search for existing user by Phone number first, then optional Email
        Optional<User> existingUserOpt = userRepository.findByPhone(tenantPhone);
        if (existingUserOpt.isEmpty() && request.getTenantEmail() != null && !request.getTenantEmail().trim().isEmpty()) {
            existingUserOpt = userRepository.findByEmail(request.getTenantEmail().trim().toLowerCase());
        }

        User tenant;
        if (existingUserOpt.isPresent()) {
            tenant = existingUserOpt.get();
            // If user is a shadow user, update their details with newly provided name and email
            if (tenant.isShadowUser()) {
                tenant.setName(request.getTenantName().trim());
                tenant.setPhone(tenantPhone);
                if (request.getTenantEmail() != null && !request.getTenantEmail().trim().isEmpty()) {
                    tenant.setEmail(request.getTenantEmail().trim().toLowerCase());
                }
                tenant = userRepository.save(tenant);
            }
        } else {
            // Provision a new Shadow User linked to this Mobile Number
            String email = (request.getTenantEmail() != null && !request.getTenantEmail().trim().isEmpty())
                    ? request.getTenantEmail().trim().toLowerCase()
                    : "shadow-" + UUID.randomUUID() + "@temp.pgmanager.com";

            User shadowUser = User.builder()
                    .name(request.getTenantName().trim())
                    .phone(tenantPhone)
                    .email(email)
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role(Role.ROLE_TENANT)
                    .active(true)
                    .shadowUser(true)
                    .build();

            tenant = userRepository.save(shadowUser);
        }

        // 2. Check if Tenant already has an active allocation
        if (allocationRepository.existsByTenantIdAndStatus(tenant.getId(), AllocationStatus.ACTIVE)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "Tenant '" + tenant.getName() + "' (" + tenant.getPhone() + ") already has an active bed allocation."
            );
        }

        // 3. Validate Bed exists and is VACANT
        Bed bed = bedRepository.findById(request.getBedId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bed not found with ID: " + request.getBedId()));

        if (bed.getStatus() != BedStatus.VACANT) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bed " + bed.getBedNumber() + " is not vacant. Current status: " + bed.getStatus());
        }

        // 4. Verify ownership of the property
        if (!isSuperAdmin) {
            var propertyOwner = bed.getRoom().getProperty().getOwner();
            if (!propertyOwner.getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to allocate beds in this property.");
            }
        }

        // 5. Update Bed status to OCCUPIED and assign tenant
        bed.setStatus(BedStatus.OCCUPIED);
        bed.setCurrentTenantId(tenant.getId());
        bedRepository.save(bed);

        // 6. Save Allocation entity
        Allocation allocation = Allocation.builder()
                .tenant(tenant)
                .bed(bed)
                .checkInDate(request.getCheckInDate())
                .checkOutDate(null)
                .depositAmount(request.getDepositAmount())
                .monthlyRent(request.getMonthlyRent())
                .status(AllocationStatus.ACTIVE)
                .build();

        Allocation savedAllocation = allocationRepository.save(allocation);

        return AllocationResponse.fromEntity(savedAllocation);
    }

    /**
     * Checks out a tenant, sets checkout date, and frees the bed back to VACANT.
     */
    @Override
    public AllocationResponse checkoutTenant(Long allocationId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Allocation allocation = allocationRepository.findById(allocationId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Allocation record not found with ID: " + allocationId));

        if (allocation.getStatus() == AllocationStatus.COMPLETED) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Allocation is already marked as COMPLETED.");
        }

        // Verify authorization (PG Owner of the property, or SUPER_ADMIN)
        if (!isSuperAdmin) {
            var propertyOwner = allocation.getBed().getRoom().getProperty().getOwner();
            if (!propertyOwner.getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to check out tenants from this property.");
            }
        }

        // 1. Mark allocation completed and set checkout date
        allocation.setStatus(AllocationStatus.COMPLETED);
        if (allocation.getCheckOutDate() == null) {
            allocation.setCheckOutDate(LocalDate.now());
        }

        // 2. Revert Bed status to VACANT and clear tenant ID
        Bed bed = allocation.getBed();
        if (bed != null) {
            bed.setStatus(BedStatus.VACANT);
            bed.setCurrentTenantId(null);
            bedRepository.save(bed);
        }

        Allocation updatedAllocation = allocationRepository.save(allocation);

        return AllocationResponse.fromEntity(updatedAllocation);
    }

    /**
     * Retrieves all active allocations for the caller's properties.
     */
    @Override
    @Transactional(readOnly = true)
    public List<AllocationResponse> getActiveAllocations(String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        List<Allocation> allocations = isSuperAdmin
                ? allocationRepository.findByStatus(AllocationStatus.ACTIVE)
                : allocationRepository.findByBedRoomPropertyOwnerIdAndStatus(user.getId(), AllocationStatus.ACTIVE);

        return allocations.stream()
                .map(AllocationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves active allocation for the logged-in tenant.
     */
    @Override
    @Transactional(readOnly = true)
    public AllocationResponse getMyAllocation(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant profile not found: " + tenantEmail));

        Allocation allocation = allocationRepository.findFirstByTenantIdAndStatus(tenant.getId(), AllocationStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active bed allocation found for your account."));

        return AllocationResponse.fromEntity(allocation);
    }

    /**
     * Retrieves active allocation details for a specific bed ID.
     */
    @Override
    @Transactional(readOnly = true)
    public AllocationResponse getActiveAllocationByBedId(Long bedId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bed not found with ID: " + bedId));

        if (!isSuperAdmin) {
            var propertyOwner = bed.getRoom().getProperty().getOwner();
            if (!propertyOwner.getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view allocations for this property.");
            }
        }

        Allocation allocation = allocationRepository.findFirstByBedIdAndStatus(bedId, AllocationStatus.ACTIVE)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "No active allocation found for Bed ID: " + bedId));

        return AllocationResponse.fromEntity(allocation);
    }
}
