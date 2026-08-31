package com.example.backend.propertymanagement.service.impl;

import com.example.backend.propertymanagement.dto.request.CreatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
import com.example.backend.propertymanagement.dto.response.PropertyResponse;
import com.example.backend.propertymanagement.dto.response.RoomResponse;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.propertymanagement.repository.RoomRepository;
import com.example.backend.propertymanagement.service.PropertyService;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for managing PG properties, rooms, and automatic bed creation.
 */
@Service
@Transactional
public class PropertyServiceImpl implements PropertyService {

    private final PropertyRepository propertyRepository;
    private final RoomRepository roomRepository;
    private final BedRepository bedRepository;
    private final UserRepository userRepository;

    public PropertyServiceImpl(PropertyRepository propertyRepository,
                               RoomRepository roomRepository,
                               BedRepository bedRepository,
                               UserRepository userRepository) {
        this.propertyRepository = propertyRepository;
        this.roomRepository = roomRepository;
        this.bedRepository = bedRepository;
        this.userRepository = userRepository;
    }

    /**
     * Creates and persists a new Property associated with the logged-in owner.
     */
    @Override
    public PropertyResponse createProperty(CreatePropertyRequest request, String ownerEmail) {
        User owner = userRepository.findByEmail(ownerEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + ownerEmail));

        if (propertyRepository.existsByNameAndOwnerId(request.getName().trim(), owner.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A property named '" + request.getName() + "' already exists for this owner.");
        }

        Property property = Property.builder()
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .totalFloors(request.getTotalFloors())
                .owner(owner)
                .rooms(new ArrayList<>())
                .build();

        Property savedProperty = propertyRepository.save(property);
        return PropertyResponse.fromEntity(savedProperty);
    }

    /**
     * Retrieves all properties belonging to the logged-in owner, or all properties if user is SUPER_ADMIN.
     */
    @Override
    @Transactional(readOnly = true)
    public List<PropertyResponse> getOwnerProperties(String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + userEmail));

        List<Property> properties = isSuperAdmin
                ? propertyRepository.findAll()
                : propertyRepository.findByOwnerId(user.getId());

        return properties.stream()
                .map(PropertyResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves a single property by its ID with full room and bed hierarchy.
     */
    @Override
    @Transactional(readOnly = true)
    public PropertyResponse getPropertyById(Long propertyId, String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!isSuperAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view this property.");
        }

        return PropertyResponse.fromEntity(property);
    }

    /**
     * Creates a new room inside a property and automatically generates Bed entities based on RoomType capacity.
     */
    @Override
    public RoomResponse createRoom(Long propertyId, CreateRoomRequest request, String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!isSuperAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to add rooms to this property.");
        }

        if (request.getFloor() > property.getTotalFloors()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Floor number cannot exceed total floors (" + property.getTotalFloors() + ").");
        }

        if (roomRepository.existsByPropertyIdAndRoomNumber(propertyId, request.getRoomNumber().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number '" + request.getRoomNumber() + "' already exists in this property.");
        }

        // 1. Build and save Room entity
        Room room = Room.builder()
                .property(property)
                .roomNumber(request.getRoomNumber().trim())
                .floor(request.getFloor())
                .roomType(request.getRoomType())
                .baseRent(request.getBaseRent())
                .hasAc(request.isHasAc())
                .beds(new ArrayList<>())
                .build();

        Room savedRoom = roomRepository.save(room);

        // 2. Core Logic: Automatically generate Bed entities according to RoomType capacity
        int capacity = request.getRoomType().getCapacity();
        List<Bed> bedsToCreate = new ArrayList<>();

        for (int i = 0; i < capacity; i++) {
            char bedLetter = (char) ('A' + i);
            String bedNumber = savedRoom.getRoomNumber() + "-" + bedLetter;

            Bed bed = Bed.builder()
                    .room(savedRoom)
                    .bedNumber(bedNumber)
                    .status(BedStatus.VACANT)
                    .currentTenantId(null)
                    .build();

            bedsToCreate.add(bed);
        }

        List<Bed> savedBeds = bedRepository.saveAll(bedsToCreate);
        savedRoom.setBeds(savedBeds);

        return RoomResponse.fromEntity(savedRoom);
    }
}
