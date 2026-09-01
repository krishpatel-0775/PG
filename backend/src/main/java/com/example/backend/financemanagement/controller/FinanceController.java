package com.example.backend.financemanagement.controller;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.request.RecordPaymentRequest;
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
 * REST Controller providing anniversary billing, invoice generation, payment recording,
 * and tenant dues retrieval endpoints.
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
     * Manual trigger for the daily billing cron job for testing and on-demand invoice generation.
     */
    @PostMapping("/invoices/trigger")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> triggerDailyInvoices() {
        List<InvoiceResponse> generated = financeService.generateDailyInvoices();
        return ResponseEntity.status(HttpStatus.CREATED).body(generated);
    }

    /**
     * Manual generation endpoint (kept for UI compatibility).
     */
    @PostMapping("/invoices/generate-manual")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> generateInvoicesManual() {
        List<InvoiceResponse> generated = financeService.generateDailyInvoices();
        return ResponseEntity.status(HttpStatus.CREATED).body(generated);
    }

    /**
     * Retrieves all pending (UNPAID and PARTIALLY_PAID) invoices across active tenants for the PG Owner.
     */
    @GetMapping("/invoices/pending")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getPendingOwnerInvoices(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<InvoiceResponse> pending = financeService.getPendingOwnerInvoices(userEmail, isSuperAdmin);
        return ResponseEntity.ok(pending);
    }

    /**
     * Alias endpoint for pending dues (kept for UI compatibility).
     */
    @GetMapping("/invoices/dues")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<InvoiceResponse>> getPendingDues(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<InvoiceResponse> dues = financeService.getPendingOwnerInvoices(userEmail, isSuperAdmin);
        return ResponseEntity.ok(dues);
    }

    /**
     * Retrieves all invoices for the authenticated tenant.
     */
    @GetMapping("/invoices/my")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<InvoiceResponse>> getMyInvoices(Authentication authentication) {
        String tenantEmail = authentication.getName();
        List<InvoiceResponse> invoices = financeService.getMyInvoices(tenantEmail);
        return ResponseEntity.ok(invoices);
    }

    /**
     * Retrieves pending dues for the logged-in tenant (kept for UI compatibility).
     */
    @GetMapping("/my-dues")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<InvoiceResponse>> getMyDues(Authentication authentication) {
        String tenantEmail = authentication.getName();
        List<InvoiceResponse> dues = financeService.getMyDues(tenantEmail);
        return ResponseEntity.ok(dues);
    }

    /**
     * Records a manual payment (Cash, UPI, etc.) against an invoice by PG Owner or Super Admin.
     */
    @PostMapping("/payments/record")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<PaymentResponse> recordManualPayment(@Valid @RequestBody RecordPaymentRequest request) {
        PaymentResponse response = financeService.recordManualPayment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Simulates an online payment gateway integration for a tenant settling an invoice.
     */
    @PostMapping("/payments/mock-online/{invoiceId}")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<PaymentResponse> mockTenantOnlinePayment(@PathVariable Long invoiceId) {
        PaymentResponse response = financeService.mockTenantOnlinePayment(invoiceId);
        return ResponseEntity.ok(response);
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

    /**
     * Helper method to verify if user has ROLE_SUPER_ADMIN authority.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
