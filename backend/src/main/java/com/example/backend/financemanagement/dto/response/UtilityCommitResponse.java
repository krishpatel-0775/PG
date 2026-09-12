package com.example.backend.financemanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Response DTO returned after a successful utility billing commit operation.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityCommitResponse {

    private Long meterReadingId;
    private Long roomId;
    private String roomNumber;
    private String billingMonth;
    private BigDecimal unitsConsumed;
    private BigDecimal totalRoomCost;
    private BigDecimal ownerAbsorbedAmount;
    private LocalDate readingDate;

    /** Number of UTILITY invoices generated in this commit. */
    private int invoicesGenerated;

    /** Per-tenant share details with invoice references. */
    private List<UtilityShareResponse> tenantShares;
}
