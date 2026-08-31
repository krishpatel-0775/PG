package com.example.backend.dashboard.controller;

import com.example.backend.dashboard.dto.response.DashboardSummaryResponse;
import com.example.backend.dashboard.service.DashboardService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller providing aggregated property operational summaries and KPI metrics.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * GET /api/dashboard/summary/property/{propertyId}:
     * Aggregates occupancy, outstanding rent dues, and open maintenance tickets.
     */
    @GetMapping("/summary/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<DashboardSummaryResponse> getPropertySummary(
            @PathVariable Long propertyId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        DashboardSummaryResponse response = dashboardService.getSummary(propertyId, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
