package com.example.backend.financemanagement.service;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.request.RecordPaymentRequest;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.dto.response.PaymentResponse;

import java.util.List;

/**
 * Service interface managing anniversary-date billing cycles, automated invoice generation,
 * payment recording, and tenant dues tracking.
 */
public interface FinanceService {

    /**
     * Generates daily anniversary-date rent invoices for all ACTIVE bed allocations.
     * Scheduled to run daily at 1:00 AM (0 0 1 * * ?), or invoked on-demand via REST endpoint.
     *
     * @return List of generated InvoiceResponse DTOs
     */
    List<InvoiceResponse> generateDailyInvoices();

    /**
     * Retrieves all UNPAID and PARTIALLY_PAID invoices for active tenants across properties
     * owned by the authenticated PG Owner.
     *
     * @param ownerEmail Email of the authenticated owner caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of pending InvoiceResponse DTOs
     */
    List<InvoiceResponse> getPendingOwnerInvoices(String ownerEmail, boolean isSuperAdmin);

    /**
     * Retrieves all invoices (historical and pending) for the authenticated tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return List of tenant InvoiceResponse DTOs
     */
    List<InvoiceResponse> getMyInvoices(String tenantEmail);

    /**
     * Records a manual payment (Cash, UPI, etc.) against an invoice, increments paid amounts,
     * and transitions the invoice status accordingly.
     *
     * @param request Validated payment request payload
     * @return PaymentResponse DTO
     */
    PaymentResponse recordManualPayment(RecordPaymentRequest request);

    /**
     * Simulates an online tenant payment gateway settlement for a given invoice.
     *
     * @param invoiceId Target invoice ID
     * @return PaymentResponse DTO
     */
    PaymentResponse mockTenantOnlinePayment(Long invoiceId);

    /**
     * Legacy/extended payment recording with ownership checks.
     *
     * @param request Validated payment request payload
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return PaymentResponse DTO
     */
    PaymentResponse recordPayment(CreatePaymentRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves all pending dues (UNPAID or PARTIALLY_PAID) across the owner's properties.
     */
    List<InvoiceResponse> getPendingDues(String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves outstanding unpaid/partially paid dues for a specific tenant.
     */
    List<InvoiceResponse> getTenantDues(Long tenantId, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves all pending dues for the authenticated tenant.
     */
    List<InvoiceResponse> getMyDues(String tenantEmail);

    /**
     * Retrieves a single invoice with full payment breakdown.
     */
    InvoiceResponse getInvoiceById(Long invoiceId, String userEmail, boolean isSuperAdmin);

    /**
     * Generates monthly rent invoices. Kept for backwards compatibility.
     */
    List<InvoiceResponse> generateMonthlyInvoices();
}
