package com.example.backend.tenantmanagement.service;

import com.example.backend.tenantmanagement.dto.request.CreateAllocationRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;

import java.util.List;

/**
 * Service interface managing tenant bed allocations, lease lifecycles, and checkouts.
 */
public interface AllocationService {

    /**
     * Allocates a vacant bed to a tenant by email. Automatically creates a shadow user
     * if the tenant account does not already exist.
     *
     * @param request Validated allocation request payload
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return AllocationResponse DTO
     */
    AllocationResponse allocateBed(CreateAllocationRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Completes a tenant's lease, sets checkout date, and reverts bed status back to VACANT.
     *
     * @param allocationId Allocation ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return AllocationResponse DTO
     */
    AllocationResponse checkoutTenant(Long allocationId, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves active allocations for properties owned by the authenticated PG Owner (or all if SUPER_ADMIN).
     *
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of active AllocationResponse DTOs
     */
    List<AllocationResponse> getActiveAllocations(String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves the current active bed allocation for the logged-in tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return AllocationResponse DTO
     */
    AllocationResponse getMyAllocation(String tenantEmail);

    /**
     * Retrieves active allocation details for a specific bed ID (used when owner clicks an occupied bed).
     *
     * @param bedId Bed ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return AllocationResponse DTO
     */
    AllocationResponse getActiveAllocationByBedId(Long bedId, String userEmail, boolean isSuperAdmin);
}
