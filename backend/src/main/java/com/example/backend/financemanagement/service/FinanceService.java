package com.example.backend.financemanagement.service;

import com.example.backend.financemanagement.dto.request.CreatePaymentRequest;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.dto.response.PaymentResponse;

import java.util.List;

/**
 * Service interface managing billing cycles, automated monthly invoicing, payments, and tenant dues.
 */
public interface FinanceService {

    /**
     * Generates monthly rent invoices for all ACTIVE bed allocations.
     * Scheduled to run on the 1st of every month at midnight, or invoked manually.
     *
     * @return List of generated InvoiceResponse DTOs
     */
    List<InvoiceResponse> generateMonthlyInvoices();

    /**
     * Records a payment against an invoice, increments paid amounts, and transitions invoice status.
     * Prevents overpayment beyond the outstanding invoice balance.
     *
     * @param request Validated payment request payload
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return PaymentResponse DTO
     */
    PaymentResponse recordPayment(CreatePaymentRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves all UNPAID and PARTIALLY_PAID invoices for properties owned by the authenticated owner.
     *
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of pending InvoiceResponse DTOs
     */
    List<InvoiceResponse> getPendingDues(String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves outstanding unpaid/partially paid dues for a specific tenant.
     *
     * @param tenantId Tenant ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of pending InvoiceResponse DTOs
     */
    List<InvoiceResponse> getTenantDues(Long tenantId, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves all pending dues for the authenticated tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return List of pending InvoiceResponse DTOs
     */
    List<InvoiceResponse> getMyDues(String tenantEmail);

    /**
     * Retrieves a single invoice with full payment breakdown.
     *
     * @param invoiceId Invoice ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return InvoiceResponse DTO
     */
    InvoiceResponse getInvoiceById(Long invoiceId, String userEmail, boolean isSuperAdmin);
}
