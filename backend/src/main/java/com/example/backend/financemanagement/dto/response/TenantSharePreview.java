package com.example.backend.financemanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Preview of a single tenant's prorated electricity share, returned in a preview response
 * without any database writes.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantSharePreview {

    private Long tenantId;
    private String tenantName;
    private String tenantEmail;
    private Long allocationId;
    private Long bedId;
    private String bedNumber;

    /** Days the tenant occupied the bed within the billing month. */
    private Integer daysOccupied;

    /** Total calendar days in the billing month (28/29/30/31). */
    private Integer totalDaysInMonth;

    /** Whether the tenant occupied the bed for the full month. */
    private boolean fullMonthOccupied;

    /** Calculated prorated share amount in INR. */
    private BigDecimal shareAmount;
}
