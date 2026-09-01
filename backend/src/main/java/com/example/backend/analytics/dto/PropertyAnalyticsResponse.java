package com.example.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * Aggregated analytics response payload for visual dashboard reporting.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyAnalyticsResponse {

    private List<RevenueDataDTO> sixMonthRevenueTrend;
    private OccupancyDataDTO currentOccupancy;
    private List<ComplaintDataDTO> complaintsByCategory;
    private BigDecimal currentMonthTotalExpected;
    private int newCheckInsThisMonth;
}
