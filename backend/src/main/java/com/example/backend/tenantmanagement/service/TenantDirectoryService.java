package com.example.backend.tenantmanagement.service;

import com.example.backend.tenantmanagement.dto.response.TenantListResponse;
import com.example.backend.tenantmanagement.dto.response.TenantProfileResponse;

import java.util.List;

/**
 * Service interface for PG Owner CRM Tenant Directory operations.
 * Aggregates tenant personal profiles, bed allocations, and historical invoices.
 */
public interface TenantDirectoryService {

    /**
     * Retrieves all tenants that have stayed or are staying in properties owned by the authenticated owner.
     * Results are sorted with ACTIVE tenants first, followed by most recent check-in date.
     *
     * @param ownerEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of TenantListResponse summary DTOs
     */
    List<TenantListResponse> getAllTenantsForOwner(String ownerEmail, boolean isSuperAdmin);

    /**
     * Retrieves the complete CRM profile for a specific tenant including personal info,
     * latest stay details, and complete billing/invoice history.
     *
     * @param tenantId Target tenant user ID
     * @param ownerEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return TenantProfileResponse detailed CRM profile DTO
     */
    TenantProfileResponse getTenantProfileForOwner(Long tenantId, String ownerEmail, boolean isSuperAdmin);
}
