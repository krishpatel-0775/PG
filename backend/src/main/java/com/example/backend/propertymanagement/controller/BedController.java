package com.example.backend.propertymanagement.controller;

import com.example.backend.propertymanagement.dto.request.UpdateBedRequest;
import com.example.backend.propertymanagement.dto.response.BedResponse;
import com.example.backend.propertymanagement.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller providing bed update and deletion operations for PG Owners.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/beds")
@PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
public class BedController {

    private final PropertyService propertyService;

    public BedController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    /**
     * Updates an existing bed identifier/number.
     *
     * @param id Bed ID path variable
     * @param request Validated bed update payload
     * @param authentication Current user authentication context
     * @return Updated BedResponse DTO with HTTP 200 status
     */
    @PutMapping("/{id}")
    public ResponseEntity<BedResponse> updateBed(
            @PathVariable Long id,
            @Valid @RequestBody UpdateBedRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        BedResponse response = propertyService.updateBed(id, request, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a bed if its status is VACANT. Throws IllegalStateException if OCCUPIED.
     *
     * @param id Bed ID path variable
     * @param authentication Current user authentication context
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBed(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        propertyService.deleteBed(id, userEmail, isSuperAdmin);
        return ResponseEntity.noContent().build();
    }

    /**
     * Helper method to determine if the authenticated user has ROLE_SUPER_ADMIN authority.
     */
    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
