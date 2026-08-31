package com.example.backend.tenantmanagement.controller;

import com.example.backend.tenantmanagement.dto.request.CreateAllocationRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.service.AllocationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing bed allocation, tenant leasing, and checkout management endpoints.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/allocations")
public class AllocationController {

    private final AllocationService allocationService;

    public AllocationController(AllocationService allocationService) {
        this.allocationService = allocationService;
    }

    /**
     * Creates a new bed allocation and activates lease for a tenant.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> createAllocation(
            @Valid @RequestBody CreateAllocationRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = allocationService.allocateBed(request, userEmail, isSuperAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all active allocations for the properties owned by the authenticated PG Owner.
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<AllocationResponse>> getActiveAllocations(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<AllocationResponse> allocations = allocationService.getActiveAllocations(userEmail, isSuperAdmin);
        return ResponseEntity.ok(allocations);
    }

    /**
     * Retrieves the active bed allocation for the logged-in tenant.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<AllocationResponse> getMyAllocation(Authentication authentication) {
        String tenantEmail = authentication.getName();
        AllocationResponse response = allocationService.getMyAllocation(tenantEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Processes tenant checkout, marks allocation completed, and frees the bed.
     */
    @PostMapping("/{id}/checkout")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> checkoutTenant(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = allocationService.checkoutTenant(id, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves the active allocation details for a specific bed.
     */
    @GetMapping("/bed/{bedId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> getActiveAllocationByBedId(
            @PathVariable Long bedId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = allocationService.getActiveAllocationByBedId(bedId, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
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
