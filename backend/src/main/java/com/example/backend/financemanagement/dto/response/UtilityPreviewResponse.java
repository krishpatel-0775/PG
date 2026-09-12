package com.example.backend.financemanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * In-memory preview of utility billing for a room — no data is persisted.
 * Provides a full itemized breakdown before the owner commits the reading.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityPreviewResponse {

    private Long roomId;
    private String roomNumber;
    private String billingMonth;

    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal unitsConsumed;
    private BigDecimal ratePerUnit;

    /** Total electricity cost for the room = unitsConsumed * ratePerUnit */
    private BigDecimal totalRoomCost;

    /** Base cost per bed = totalRoomCost / room.totalCapacity */
    private BigDecimal baseSharePerBed;

    /** Sum of all tenant shares; the remainder is owner-absorbed. */
    private BigDecimal totalTenantShareAmount;

    /**
     * Amount absorbed by the PG owner for vacant beds and unoccupied fractional days.
     * ownerAbsorbedAmount = totalRoomCost - totalTenantShareAmount
     */
    private BigDecimal ownerAbsorbedAmount;

    /** Itemized per-tenant proration breakdown. */
    private List<TenantSharePreview> tenantShares;
}
