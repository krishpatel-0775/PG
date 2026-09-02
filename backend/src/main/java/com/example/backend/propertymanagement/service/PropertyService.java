package com.example.backend.propertymanagement.service;

import com.example.backend.propertymanagement.dto.request.CreatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
import com.example.backend.propertymanagement.dto.request.UpdateBedRequest;
import com.example.backend.propertymanagement.dto.request.UpdatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.UpdateRoomRequest;
import com.example.backend.propertymanagement.dto.response.BedResponse;
import com.example.backend.propertymanagement.dto.response.PropertyResponse;
import com.example.backend.propertymanagement.dto.response.RoomResponse;

import java.util.List;

/**
 * Service interface managing PG properties, rooms, and automated bed allocations.
 */
public interface PropertyService {

    /**
     * Creates a new property assigned to the authenticated owner.
     *
     * @param request Validated property creation payload
     * @param ownerEmail Email of the authenticated owner
     * @return PropertyResponse DTO
     */
    PropertyResponse createProperty(CreatePropertyRequest request, String ownerEmail);

    /**
     * Retrieves all properties belonging to the authenticated owner (or all properties if SUPER_ADMIN).
     *
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of PropertyResponse DTOs
     */
    List<PropertyResponse> getOwnerProperties(String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves detailed information of a specific property including its room and bed hierarchy.
     *
     * @param propertyId Property ID
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return PropertyResponse DTO
     */
    PropertyResponse getPropertyById(Long propertyId, String userEmail, boolean isSuperAdmin);

    /**
     * Adds a new room to a property and automatically generates all corresponding Bed entities.
     *
     * @param propertyId Property ID
     * @param request Validated room creation payload
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return RoomResponse DTO containing created room and generated beds
     */
    RoomResponse createRoom(Long propertyId, CreateRoomRequest request, String userEmail, boolean isSuperAdmin);

    // =========================================================================
    // Property Update & Delete
    // =========================================================================

    /**
     * Updates an existing property using the authenticated security context.
     *
     * @param propertyId Property ID
     * @param request Validated property update payload
     * @return Updated PropertyResponse DTO
     */
    PropertyResponse updateProperty(Long propertyId, UpdatePropertyRequest request);

    /**
     * Updates an existing property with explicit user credentials.
     *
     * @param propertyId Property ID
     * @param request Validated property update payload
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return Updated PropertyResponse DTO
     */
    PropertyResponse updateProperty(Long propertyId, UpdatePropertyRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Deletes a property ONLY if there are no active/occupied beds in any of its rooms.
     *
     * @param propertyId Property ID
     */
    void deleteProperty(Long propertyId);

    /**
     * Deletes a property ONLY if there are no active/occupied beds in any of its rooms with explicit credentials.
     *
     * @param propertyId Property ID
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     */
    void deleteProperty(Long propertyId, String userEmail, boolean isSuperAdmin);

    // =========================================================================
    // Room Update & Delete
    // =========================================================================

    /**
     * Updates room name/identifier and details using the authenticated security context.
     *
     * @param roomId Room ID
     * @param request Validated room update payload
     * @return Updated RoomResponse DTO
     */
    RoomResponse updateRoom(Long roomId, UpdateRoomRequest request);

    /**
     * Updates room name/identifier and details with explicit user credentials.
     *
     * @param roomId Room ID
     * @param request Validated room update payload
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return Updated RoomResponse DTO
     */
    RoomResponse updateRoom(Long roomId, UpdateRoomRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Deletes the room ONLY if all beds inside are VACANT.
     *
     * @param roomId Room ID
     */
    void deleteRoom(Long roomId);

    /**
     * Deletes the room ONLY if all beds inside are VACANT with explicit credentials.
     *
     * @param roomId Room ID
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     */
    void deleteRoom(Long roomId, String userEmail, boolean isSuperAdmin);

    // =========================================================================
    // Bed Update & Delete
    // =========================================================================

    /**
     * Updates bed name/identifier using the authenticated security context.
     *
     * @param bedId Bed ID
     * @param request Validated bed update payload
     * @return Updated BedResponse DTO
     */
    BedResponse updateBed(Long bedId, UpdateBedRequest request);

    /**
     * Updates bed name/identifier with explicit user credentials.
     *
     * @param bedId Bed ID
     * @param request Validated bed update payload
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return Updated BedResponse DTO
     */
    BedResponse updateBed(Long bedId, UpdateBedRequest request, String userEmail, boolean isSuperAdmin);

    /**
     * Deletes the bed ONLY if its status is VACANT. Throws IllegalStateException if OCCUPIED.
     *
     * @param bedId Bed ID
     */
    void deleteBed(Long bedId);

    /**
     * Deletes the bed ONLY if its status is VACANT with explicit user credentials. Throws IllegalStateException if OCCUPIED.
     *
     * @param bedId Bed ID
     * @param userEmail Email of the authenticated user
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     */
    void deleteBed(Long bedId, String userEmail, boolean isSuperAdmin);
}
