package com.example.backend.propertymanagement.controller;

import com.example.backend.propertymanagement.dto.request.CreatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
import com.example.backend.propertymanagement.dto.request.UpdatePropertyRequest;
import com.example.backend.propertymanagement.dto.response.PropertyResponse;
import com.example.backend.propertymanagement.dto.response.RoomResponse;
import com.example.backend.propertymanagement.service.PropertyService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing property and room management endpoints for PG Owners and Super Admins.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/properties")
@PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    /**
     * Creates a new property owned by the authenticated PG Owner.
     *
     * @param request Validated property creation payload
     * @param authentication Current user authentication context
     * @return Created PropertyResponse with HTTP 201 status
     */
    @PostMapping
    public ResponseEntity<PropertyResponse> createProperty(
            @Valid @RequestBody CreatePropertyRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        PropertyResponse response = propertyService.createProperty(request, userEmail);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Retrieves all properties for the logged-in owner (or all properties if SUPER_ADMIN).
     *
     * @param authentication Current user authentication context
     * @return List of PropertyResponse DTOs with HTTP 200 status
     */
    @GetMapping
    public ResponseEntity<List<PropertyResponse>> getProperties(Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        List<PropertyResponse> properties = propertyService.getOwnerProperties(userEmail, isSuperAdmin);
        return ResponseEntity.ok(properties);
    }

    /**
     * Retrieves detailed information of a property including its room and bed hierarchy.
     *
     * @param propertyId Property ID path variable
     * @param authentication Current user authentication context
     * @return PropertyResponse DTO with HTTP 200 status
     */
    @GetMapping("/{propertyId}")
    public ResponseEntity<PropertyResponse> getPropertyById(
            @PathVariable Long propertyId,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        PropertyResponse property = propertyService.getPropertyById(propertyId, userEmail, isSuperAdmin);
        return ResponseEntity.ok(property);
    }

    /**
     * Updates an existing property.
     *
     * @param id Property ID path variable
     * @param request Validated property update payload
     * @param authentication Current user authentication context
     * @return Updated PropertyResponse DTO with HTTP 200 status
     */
    @PutMapping("/{id}")
    public ResponseEntity<PropertyResponse> updateProperty(
            @PathVariable Long id,
            @Valid @RequestBody UpdatePropertyRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        PropertyResponse response = propertyService.updateProperty(id, request, userEmail, isSuperAdmin);
        return ResponseEntity.ok(response);
    }

    /**
     * Deletes a property if all its rooms have no active/occupied beds.
     *
     * @param id Property ID path variable
     * @param authentication Current user authentication context
     * @return HTTP 204 No Content
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProperty(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        propertyService.deleteProperty(id, userEmail, isSuperAdmin);
        return ResponseEntity.noContent().build();
    }

    /**
     * Adds a new room to a property and automatically generates its Bed entities.
     *
     * @param propertyId Property ID path variable
     * @param request Validated room creation payload
     * @param authentication Current user authentication context
     * @return Created RoomResponse DTO with HTTP 201 status
     */
    @PostMapping("/{propertyId}/rooms")
    public ResponseEntity<RoomResponse> addRoomToProperty(
            @PathVariable Long propertyId,
            @Valid @RequestBody CreateRoomRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        RoomResponse response = propertyService.createRoom(propertyId, request, userEmail, isSuperAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
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
