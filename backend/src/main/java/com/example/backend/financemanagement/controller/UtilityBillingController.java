package com.example.backend.financemanagement.controller;

import com.example.backend.financemanagement.dto.request.UtilityBillingRequest;
import com.example.backend.financemanagement.dto.response.MeterReadingResponse;
import com.example.backend.financemanagement.dto.response.UtilityCommitResponse;
import com.example.backend.financemanagement.dto.response.UtilityPreviewResponse;
import com.example.backend.financemanagement.dto.response.UtilityShareResponse;
import com.example.backend.financemanagement.service.UtilityBillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for prorated utility (electricity) billing operations.
 *
 * <p>Endpoints:
 * <ul>
 *   <li>{@code POST /api/utilities/preview} — Preview billing shares in-memory (no DB writes)</li>
 *   <li>{@code POST /api/utilities/commit} — Commit billing, persist readings and generate invoices</li>
 *   <li>{@code GET /api/utilities/room/{roomId}/history} — Historical meter readings for a room</li>
 *   <li>{@code GET /api/utilities/tenant/my-shares} — Authenticated tenant's utility share history</li>
 * </ul>
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/utilities")
public class UtilityBillingController {

    private final UtilityBillingService utilityBillingService;

    public UtilityBillingController(UtilityBillingService utilityBillingService) {
        this.utilityBillingService = utilityBillingService;
    }

    /**
     * Preview prorated electricity shares for a room without persisting any data.
     * The owner can review the itemized breakdown before committing the reading.
     *
     * @param request  Billing parameters: roomId, currentReading, ratePerUnit, billingMonth, optional previousReading
     * @return In-memory UtilityPreviewResponse with per-tenant and owner-absorbed amounts
     */
    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<UtilityPreviewResponse> previewUtilityBilling(
            @Valid @RequestBody UtilityBillingRequest request,
            Authentication authentication) {
        UtilityPreviewResponse preview = utilityBillingService.previewUtilityBilling(request);
        return ResponseEntity.ok(preview);
    }

    /**
     * Commits the utility billing for a room:
     * persists MeterReading, creates UtilityShare records, and generates UNPAID UTILITY invoices.
     *
     * @param request        Billing parameters
     * @param authentication Authenticated PG Owner / Super Admin
     * @return UtilityCommitResponse with meter reading ID, invoice count, and tenant share details
     */
    @PostMapping("/commit")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<UtilityCommitResponse> commitUtilityBilling(
            @Valid @RequestBody UtilityBillingRequest request,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        UtilityCommitResponse response = utilityBillingService.commitUtilityBilling(request, callerEmail, isSuperAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Returns historical meter readings for a room ordered by reading date descending.
     *
     * @param roomId         Target room ID
     * @param authentication Authenticated PG Owner / Super Admin
     * @return List of MeterReadingResponse DTOs
     */
    @GetMapping("/room/{roomId}/history")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<MeterReadingResponse>> getRoomMeterHistory(
            @PathVariable Long roomId,
            Authentication authentication) {
        String callerEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<MeterReadingResponse> history = utilityBillingService.getRoomMeterHistory(roomId, callerEmail, isSuperAdmin);
        return ResponseEntity.ok(history);
    }

    /**
     * Returns all utility shares (with invoice details) for the authenticated tenant.
     *
     * @param authentication Authenticated TENANT
     * @return List of UtilityShareResponse DTOs
     */
    @GetMapping("/tenant/my-shares")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<UtilityShareResponse>> getMyUtilityShares(Authentication authentication) {
        String tenantEmail = authentication.getName();
        List<UtilityShareResponse> shares = utilityBillingService.getMyUtilityShares(tenantEmail);
        return ResponseEntity.ok(shares);
    }

    /**
     * Helper method to check if the authenticated user has ROLE_SUPER_ADMIN authority.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
