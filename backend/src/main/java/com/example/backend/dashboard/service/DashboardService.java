package com.example.backend.dashboard.service;

import com.example.backend.dashboard.dto.response.DashboardSummaryResponse;

/**
 * Service interface aggregating cross-module operational summaries for properties.
 */
public interface DashboardService {

    /**
     * Aggregates occupancy, dues, and maintenance tickets for a specific property.
     *
     * @param propertyId Property ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if caller is SUPER_ADMIN
     * @return DashboardSummaryResponse DTO
     */
    DashboardSummaryResponse getSummary(Long propertyId, String userEmail, boolean isSuperAdmin);

    /**
     * Aggregates occupancy, revenue, dues, and maintenance tickets across all properties owned by the caller.
     *
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if caller is SUPER_ADMIN
     * @return DashboardSummaryResponse DTO
     */
    DashboardSummaryResponse getOwnerSummary(String userEmail, boolean isSuperAdmin);
}
