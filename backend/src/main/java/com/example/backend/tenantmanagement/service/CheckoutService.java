package com.example.backend.tenantmanagement.service;

import com.example.backend.tenantmanagement.dto.request.FinalizeCheckoutRequest;
import com.example.backend.tenantmanagement.dto.request.ServeNoticeRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutClearanceResponse;
import com.example.backend.tenantmanagement.dto.response.CheckoutSummaryResponse;

/**
 * Service interface managing the tenant move-out lifecycle:
 * <ol>
 *   <li>Tenant serves a 30-day notice → {@link AllocationStatus#NOTICE_SERVED}</li>
 *   <li>During notice period, rent invoices are auto-offset from the security deposit by the cron job</li>
 *   <li>On move-out day, owner finalizes checkout, assesses damages, and settles the deposit</li>
 * </ol>
 */
public interface CheckoutService {

    /**
     * Records the tenant's move-out notice and transitions the allocation to NOTICE_SERVED.
     * The planned checkout date must be at least 30 days from today.
     *
     * @param allocationId  Target allocation ID
     * @param request       Notice request with planned checkout date
     * @param callerEmail   Email of the caller (owner or the tenant themselves)
     * @param isSuperAdmin  True if caller has SUPER_ADMIN role
     * @return Updated AllocationResponse reflecting NOTICE_SERVED status
     */
    AllocationResponse serveNotice(Long allocationId,
                                   ServeNoticeRequest request,
                                   String callerEmail,
                                   boolean isSuperAdmin);

    /**
     * Computes a pre-finalization checkout summary without persisting any settlement data.
     * Returns remaining deposit, all outstanding invoices, and an empty damage template.
     *
     * @param allocationId  Target allocation ID
     * @param callerEmail   Email of the authenticated caller
     * @param isSuperAdmin  True if caller has SUPER_ADMIN role
     * @return CheckoutSummaryResponse with deposit breakdown and unpaid invoices
     */
    CheckoutSummaryResponse getCheckoutSummary(Long allocationId,
                                               String callerEmail,
                                               boolean isSuperAdmin);

    /**
     * Finalizes the checkout:
     * <ul>
     *   <li>Computes net refund = remainingDeposit - unpaidDues - damages</li>
     *   <li>Saves CheckoutClearance and DamageItem records</li>
     *   <li>Marks all included outstanding invoices as PAID</li>
     *   <li>Transitions allocation to VACATED and bed to VACANT (or MAINTENANCE if damages)</li>
     * </ul>
     *
     * @param allocationId  Target allocation ID
     * @param request       Finalization request with damages, payment mode, and transaction reference
     * @param callerEmail   Email of the authenticated owner
     * @param isSuperAdmin  True if caller has SUPER_ADMIN role
     * @return Full CheckoutClearanceResponse with settlement statement
     */
    CheckoutClearanceResponse finalizeCheckout(Long allocationId,
                                               FinalizeCheckoutRequest request,
                                               String callerEmail,
                                               boolean isSuperAdmin);

    /**
     * Retrieves the completed settlement statement for the authenticated tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return CheckoutClearanceResponse for the tenant's most recent VACATED allocation
     */
    CheckoutClearanceResponse getMySettlement(String tenantEmail);
}
