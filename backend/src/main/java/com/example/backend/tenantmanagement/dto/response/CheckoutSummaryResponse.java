package com.example.backend.tenantmanagement.dto.response;

import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Preview summary of the move-out settlement for a tenant — computed without saving.
 * Returned by {@code GET /api/checkout/{allocationId}/summary}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutSummaryResponse {

    private Long allocationId;
    private Long tenantId;
    private String tenantName;
    private String tenantEmail;
    private Long bedId;
    private String bedNumber;
    private Long roomId;
    private String roomNumber;
    private LocalDate checkInDate;
    private LocalDate plannedCheckoutDate;
    private LocalDate noticeServedDate;

    /** Original deposit collected at move-in. */
    private BigDecimal initialDeposit;

    /** Amount already consumed by deposit-offset rent billing during NOTICE_SERVED period. */
    private BigDecimal depositUsedForRent;

    /** Remaining balance = initialDeposit - depositUsedForRent */
    private BigDecimal remainingDeposit;

    /** All outstanding (UNPAID / PARTIALLY_PAID) invoices for this allocation. */
    private List<InvoiceResponse> unpaidInvoices;

    /** Sum of outstanding dues across all unpaid invoices. */
    private BigDecimal totalUnpaidDues;

    /** Projected refund if no damage items are added: remainingDeposit - totalUnpaidDues */
    private BigDecimal projectedRefundNoDamages;
}
