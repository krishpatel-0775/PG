package com.example.backend.analytics.controller;

import com.example.backend.analytics.dto.PropertyAnalyticsResponse;
import com.example.backend.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller providing visual dashboard metrics and operational analytics for PG Properties.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    /**
     * Retrieves aggregated visual dashboard analytics for a specific property including
     * 6-month revenue trends, occupancy breakdown, complaint distributions, and check-in counts.
     */
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<PropertyAnalyticsResponse> getPropertyAnalytics(
            @PathVariable Long propertyId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        PropertyAnalyticsResponse response = analyticsService.getPropertyAnalytics(propertyId, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
