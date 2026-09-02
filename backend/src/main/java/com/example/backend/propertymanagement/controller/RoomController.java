package com.example.backend.propertymanagement.controller;

import com.example.backend.propertymanagement.dto.request.UpdateRoomRequest;
import com.example.backend.propertymanagement.dto.response.RoomResponse;
import com.example.backend.propertymanagement.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller providing room update and deletion operations for PG Owners.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/rooms")
@PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
public class RoomController {

    private final PropertyService propertyService;

    public RoomController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    /**
     * Updates an existing room identifier and attributes.
     *
     * @param id Room ID path variable
     * @param request Validated room update payload
     * @param authentication Current user authentication context
     * @return Updated RoomResponse DTO with HTTP 200 status
     */
    @PutMapping("/{id}")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable Long id,
            @Valid @RequestBody UpdateRoomRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        RoomResponse response = propertyService.updateRoom(id, request, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a room if all beds inside are VACANT.
     *
     * @param id Room ID path variable
     * @param authentication Current user authentication context
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRoom(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        propertyService.deleteRoom(id, userEmail, isSuperAdmin);
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
