package com.example.backend.complaintmanagement.controller;

import com.example.backend.complaintmanagement.dto.request.CreateComplaintRequest;
import com.example.backend.complaintmanagement.dto.request.UpdateComplaintStatusRequest;
import com.example.backend.complaintmanagement.dto.response.ComplaintResponse;
import com.example.backend.complaintmanagement.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing complaint ticketing, status updates, and resolution workflows.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * POST /api/complaints: Submit a new maintenance ticket as an authenticated tenant.
     */
    @PostMapping
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<ComplaintResponse> raiseComplaint(
            @Valid @RequestBody CreateComplaintRequest request,
            Authentication authentication) {
        String tenantEmail = authentication.getName();
        ComplaintResponse response = complaintService.raiseComplaint(request, tenantEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/complaints/my: View all tickets filed by the logged-in tenant.
     */
    @GetMapping("/my")
    @PreAuthorize("hasRole('TENANT')")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints(Authentication authentication) {
        String tenantEmail = authentication.getName();
        List<ComplaintResponse> complaints = complaintService.getMyComplaints(tenantEmail);
        return ResponseEntity.ok(complaints);
    }

    /**
     * GET /api/complaints/property/{propertyId}: View complaints for a specific property.
     */
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<List<ComplaintResponse>> getPropertyComplaints(
            @PathVariable Long propertyId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = hasRole(authentication, "ROLE_SUPER_ADMIN");
        boolean isStaff = hasRole(authentication, "ROLE_STAFF");
        List<ComplaintResponse> complaints = complaintService.getPropertyComplaints(propertyId, userEmail, isSuperAdmin, isStaff);
        return ResponseEntity.ok(complaints);
    }

    /**
     * GET /api/complaints/owner: View all complaints across the owner's properties.
     */
    @GetMapping("/owner")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<List<ComplaintResponse>> getOwnerComplaints(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = hasRole(authentication, "ROLE_SUPER_ADMIN");
        List<ComplaintResponse> complaints = complaintService.getOwnerComplaints(userEmail, isSuperAdmin);
        return ResponseEntity.ok(complaints);
    }

    /**
     * PUT /api/complaints/{id}/status: Update complaint status (OPEN, IN_PROGRESS, RESOLVED).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'STAFF', 'SUPER_ADMIN')")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateComplaintStatusRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = hasRole(authentication, "ROLE_SUPER_ADMIN");
        boolean isStaff = hasRole(authentication, "ROLE_STAFF");
        ComplaintResponse response = complaintService.updateComplaintStatus(id, request, userEmail, isSuperAdmin, isStaff);
        return ResponseEntity.ok(response);
    }

    private boolean hasRole(Authentication authentication, String role) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals(role));
    }
}
