package com.example.backend.tenantmanagement.controller;

import com.example.backend.tenantmanagement.dto.request.ApproveNoticeRequest;
import com.example.backend.tenantmanagement.dto.request.FinalizeCheckoutRequest;
import com.example.backend.tenantmanagement.dto.request.RejectNoticeRequest;
import com.example.backend.tenantmanagement.dto.request.ServeNoticeRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutClearanceResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutSummaryResponse;
import com.example.backend.tenantmanagement.service.CheckoutService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller managing the tenant move-out lifecycle:
 * notice serving, checkout summary, settlement finalization, and statement retrieval.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code POST /api/allocations/{id}/notice} — Tenant submits move-out request</li>
 *   <li>{@code POST /api/allocations/{id}/notice/approve} — Owner approves notice and chooses deposit policy</li>
 *   <li>{@code POST /api/allocations/{id}/notice/reject} — Owner rejects notice request</li>
 *   <li>{@code GET /api/checkout/{allocationId}/summary} — Owner views pre-settlement summary</li>
 *   <li>{@code POST /api/checkout/{allocationId}/finalize} — Owner finalizes checkout and settles deposit</li>
 *   <li>{@code GET /api/checkout/tenant/my-settlement} — Tenant views their final settlement statement</li>
 * </ul>
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    /**
     * Serves a move-out notice request for an allocation.
     * The planned checkout date must be at least 30 days from today.
     * Accessible by the tenant themselves, the property owner, or a SUPER_ADMIN.
     * Transitions allocation to NOTICE_REQUESTED.
     *
     * @param id             Allocation ID
     * @param request        Notice request with planned checkout date
     * @param authentication Caller (TENANT, PG_OWNER, or SUPER_ADMIN)
     * @return Updated AllocationResponse with NOTICE_REQUESTED status
     */
    @PostMapping("/api/allocations/{id}/notice")
    @PreAuthorize("hasAnyRole('TENANT', 'PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> serveNotice(
            @PathVariable Long id,
            @Valid @RequestBody ServeNoticeRequest request,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = checkoutService.serveNotice(id, request, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Approves a tenant's move-out notice request with the specified deposit handling policy.
     * Owner or Super Admin only. Transitions allocation to NOTICE_SERVED.
     *
     * @param id             Allocation ID
     * @param request        Approval request with deposit policy
     * @param authentication Authenticated PG Owner / Super Admin
     * @return Updated AllocationResponse with NOTICE_SERVED status
     */
    @PostMapping("/api/allocations/{id}/notice/approve")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> approveNotice(
            @PathVariable Long id,
            @Valid @RequestBody ApproveNoticeRequest request,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = checkoutService.approveNotice(id, request, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Rejects a tenant's move-out notice request and provides a reason.
     * Owner or Super Admin only. Reverts allocation status to ACTIVE.
     *
     * @param id             Allocation ID
     * @param request        Rejection request with reason
     * @param authentication Authenticated PG Owner / Super Admin
     * @return Updated AllocationResponse with ACTIVE status
     */
    @PostMapping("/api/allocations/{id}/notice/reject")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<AllocationResponse> rejectNotice(
            @PathVariable Long id,
            @Valid @RequestBody RejectNoticeRequest request,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        AllocationResponse response = checkoutService.rejectNotice(id, request, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Returns a pre-finalization checkout summary showing remaining deposit,
     * all outstanding invoices, and projected refund (with no damage items).
     * Owner or Super Admin only.
     *
     * @param allocationId   Target allocation ID
     * @param authentication Authenticated PG Owner / Super Admin
     * @return CheckoutSummaryResponse with deposit breakdown and unpaid invoice list
     */
    @GetMapping("/api/checkout/{allocationId}/summary")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<CheckoutSummaryResponse> getCheckoutSummary(
            @PathVariable Long allocationId,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        CheckoutSummaryResponse summary = checkoutService.getCheckoutSummary(allocationId, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(summary);
    }

    /**
     * Finalizes the checkout and security deposit settlement.
     * Accepts itemized damage charges, payment mode, and transaction reference.
     * Closes all outstanding invoices, transitions allocation to VACATED, and updates the bed status.
     *
     * @param allocationId   Target allocation ID
     * @param request        Finalization request with damages, payment mode, and UTR/reference
     * @param authentication Authenticated PG Owner / Super Admin
     * @return Full CheckoutClearanceResponse with settlement breakdown
     */
    @PostMapping("/api/checkout/{allocationId}/finalize")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<CheckoutClearanceResponse> finalizeCheckout(
            @PathVariable Long allocationId,
            @Valid @RequestBody FinalizeCheckoutRequest request,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        CheckoutClearanceResponse response = checkoutService.finalizeCheckout(
                allocationId, request, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves the authenticated tenant's final checkout clearance and settlement statement.
     *
     * @param authentication Authenticated TENANT
     * @return CheckoutClearanceResponse for the tenant's latest settled allocation
     */
    @GetMapping("/api/checkout/tenant/my-settlement")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<CheckoutClearanceResponse> getMySettlement(Authentication authentication) {
        String tenantEmail = authentication.getName();
        CheckoutClearanceResponse response = checkoutService.getMySettlement(tenantEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * Helper method to verify if the authenticated user has ROLE_SUPER_ADMIN authority.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
