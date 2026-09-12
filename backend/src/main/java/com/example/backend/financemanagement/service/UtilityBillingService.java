package com.example.backend.financemanagement.service;

import com.example.backend.financemanagement.dto.request.UtilityBillingRequest;
import com.example.backend.financemanagement.dto.response.MeterReadingResponse;
import com.example.backend.financemanagement.dto.response.UtilityCommitResponse;
import com.example.backend.financemanagement.dto.response.UtilityPreviewResponse;
import com.example.backend.financemanagement.dto.response.UtilityShareResponse;

import java.util.List;

/**
 * Service interface managing prorated utility (electricity) billing operations.
 * <p>
 * The billing lifecycle is:
 * <ol>
 *   <li>Owner submits meter readings → {@link #previewUtilityBilling} returns itemized shares (no DB writes).</li>
 *   <li>Owner reviews and confirms → {@link #commitUtilityBilling} persists MeterReading, UtilityShare records,
 *       and generates UTILITY invoices for each active tenant.</li>
 * </ol>
 */
public interface UtilityBillingService {

    /**
     * Computes in-memory prorated electricity shares for all active tenants in a room
     * for the given billing month, without persisting any data.
     *
     * @param request Meter reading request with roomId, readings, rate, and billing month
     * @return Full itemized preview including per-tenant shares and owner-absorbed amount
     */
    UtilityPreviewResponse previewUtilityBilling(UtilityBillingRequest request);

    /**
     * Commits the utility billing for a room:
     * persists the MeterReading, creates UtilityShare records, and generates UNPAID UTILITY invoices.
     *
     * @param request        Meter reading request
     * @param callerEmail    Email of the authenticated PG Owner performing the commit
     * @param isSuperAdmin   True if caller has SUPER_ADMIN role
     * @return Commit response with meter reading ID, invoice count, and per-tenant share details
     */
    UtilityCommitResponse commitUtilityBilling(UtilityBillingRequest request,
                                               String callerEmail,
                                               boolean isSuperAdmin);

    /**
     * Retrieves historical meter readings for a specific room, ordered by reading date descending.
     *
     * @param roomId       Target room ID
     * @param callerEmail  Email of the authenticated caller
     * @param isSuperAdmin True if caller has SUPER_ADMIN role
     * @return Ordered list of MeterReadingResponse DTOs
     */
    List<MeterReadingResponse> getRoomMeterHistory(Long roomId, String callerEmail, boolean isSuperAdmin);

    /**
     * Retrieves all utility share records (with invoice details) for the authenticated tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return List of UtilityShareResponse DTOs
     */
    List<UtilityShareResponse> getMyUtilityShares(String tenantEmail);
}
