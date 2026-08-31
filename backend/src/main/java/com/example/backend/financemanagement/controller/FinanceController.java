package com.example.backend.financemanagement.controller;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.dto.response.PaymentResponse;
import com.example.backend.financemanagement.service.FinanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing billing, invoice generation, payment recording, and dues endpoints.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/finance")
public class FinanceController {

    private final FinanceService financeService;

    public FinanceController(FinanceService financeService) {
        this.financeService = financeService;
    }

    /**
     * Triggers invoice generation manually for testing or on-demand billing cycles.
     */
    @PostMapping("/invoices/generate-manual")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> generateMonthlyInvoicesManual() {
        List<InvoiceResponse> generated = financeService.generateMonthlyInvoices();
        return ResponseEntity.status(HttpStatus.CREATED).body(generated);
    }

    /**
     * Records a new rent payment against an existing invoice.
     */
    @PostMapping("/payments")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<PaymentResponse> recordPayment(
            @Valid @RequestBody CreatePaymentRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        PaymentResponse response = financeService.recordPayment(request, userEmail, isSuperAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all pending/unpaid invoices across the owner's properties.
     */
    @GetMapping("/invoices/dues")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getPendingDues(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<InvoiceResponse> dues = financeService.getPendingDues(userEmail, isSuperAdmin);
        return ResponseEntity.ok(dues);
    }

    /**
     * Retrieves pending dues for the logged-in tenant.
     */
    @GetMapping("/my-dues")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<InvoiceResponse>> getMyDues(Authentication authentication) {
        String tenantEmail = authentication.getName();
        List<InvoiceResponse> dues = financeService.getMyDues(tenantEmail);
        return ResponseEntity.ok(dues);
    }

    /**
     * Retrieves pending dues for a specific tenant ID (Owner access).
     */
    @GetMapping("/tenant/{tenantId}/dues")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getTenantDues(
            @PathVariable Long tenantId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<InvoiceResponse> dues = financeService.getTenantDues(tenantId, userEmail, isSuperAdmin);
        return ResponseEntity.ok(dues);
    }

    /**
     * Retrieves a single invoice with payment breakdown.
     */
    @GetMapping("/invoices/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<InvoiceResponse> getInvoiceById(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        InvoiceResponse invoice = financeService.getInvoiceById(id, userEmail, isSuperAdmin);
        return ResponseEntity.ok(invoice);
    }

    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
