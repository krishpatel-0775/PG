package com.example.backend.dashboard.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Aggregated analytics and operational summary for a PG property dashboard.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {

    private Long propertyId;
    private String propertyName;
    private Integer totalBeds;
    private Integer occupiedBeds;
    private Integer vacantBeds;
    private Integer maintenanceBeds;
    private BigDecimal totalPendingRent;
    private Integer openComplaintsCount;
    private Double occupancyRate;
}
