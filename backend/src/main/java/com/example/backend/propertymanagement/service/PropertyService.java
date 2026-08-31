package com.example.backend.propertymanagement.service;

import com.example.backend.propertymanagement.dto.request.CreatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
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
}
