package com.example.backend.analytics.service;

import com.example.backend.analytics.dto.PropertyAnalyticsResponse;

/**
 * Service interface for aggregating PG Property operational, revenue, and complaint analytics.
 */
public interface AnalyticsService {

    /**
     * Computes 360° visual dashboard analytics for a specific property including:
     * 1. 6-Month historical collected vs pending revenue trend
     * 2. Current bed occupancy status breakdown (Occupied, Vacant, Maintenance)
     * 3. Complaint volume distribution by category
     * 4. Current month expected total billing
     * 5. Number of new tenant check-ins this month
     *
     * @param propertyId Property ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return PropertyAnalyticsResponse aggregated DTO
     */
    PropertyAnalyticsResponse getPropertyAnalytics(Long propertyId, String userEmail, boolean isSuperAdmin);
}
