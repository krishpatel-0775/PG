package com.example.backend.tenantmanagement.controller;

import com.example.backend.tenantmanagement.dto.response.TenantListResponse;
import com.example.backend.tenantmanagement.dto.response.TenantProfileResponse;
import com.example.backend.tenantmanagement.service.TenantDirectoryService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing PG Owner CRM Tenant Directory and profile aggregation endpoints.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/directory")
public class TenantDirectoryController {

    private final TenantDirectoryService tenantDirectoryService;

    public TenantDirectoryController(TenantDirectoryService tenantDirectoryService) {
        this.tenantDirectoryService = tenantDirectoryService;
    }

    /**
     * Lists all tenants associated with the authenticated PG Owner across their properties.
     */
    @GetMapping("/tenants")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<TenantListResponse>> getAllTenants(Authentication authentication) {
        String ownerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<TenantListResponse> tenants = tenantDirectoryService.getAllTenantsForOwner(ownerEmail, isSuperAdmin);
        return ResponseEntity.ok(tenants);
    }

    /**
     * Retrieves the complete CRM profile for a specific tenant ID including stay allocation and invoices.
     */
    @GetMapping("/tenants/{tenantId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<TenantProfileResponse> getTenantProfile(
            @PathVariable Long tenantId,
            Authentication authentication) {
        String ownerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        TenantProfileResponse profile = tenantDirectoryService.getTenantProfileForOwner(tenantId, ownerEmail, isSuperAdmin);
        return ResponseEntity.ok(profile);
    }

    /**
     * Helper method to verify if user has ROLE_SUPER_ADMIN authority.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
