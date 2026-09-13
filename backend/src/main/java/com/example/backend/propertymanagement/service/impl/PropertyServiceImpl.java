package com.example.backend.propertymanagement.service.impl;

import com.example.backend.propertymanagement.dto.request.CreatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
import com.example.backend.propertymanagement.dto.request.UpdateBedRequest;
import com.example.backend.propertymanagement.dto.request.UpdatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.UpdateRoomRequest;
import com.example.backend.propertymanagement.dto.response.BedResponse;
import com.example.backend.propertymanagement.dto.response.PropertyResponse;
import com.example.backend.propertymanagement.dto.response.RoomResponse;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.BillingCycleType;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.propertymanagement.repository.RoomRepository;
import com.example.backend.propertymanagement.service.PropertyService;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service implementation for managing PG properties, rooms, and automatic bed creation,
 * updates, and constrained deletions.
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

        BillingCycleType billingCycle = request.getBillingCyclePreference() != null
                ? request.getBillingCyclePreference()
                : BillingCycleType.ANNIVERSARY;

        Property property = Property.builder()
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .totalFloors(request.getTotalFloors())
                .billingCyclePreference(billingCycle)
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

    // =========================================================================
    // Property Update & Delete
    // =========================================================================

    @Override
    public PropertyResponse updateProperty(Long propertyId, UpdatePropertyRequest request) {
        return updateProperty(propertyId, request, null, null);
    }

    @Override
    public PropertyResponse updateProperty(Long propertyId, UpdatePropertyRequest request, String userEmail, boolean isSuperAdmin) {
        return updateProperty(propertyId, request, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private PropertyResponse updateProperty(Long propertyId, UpdatePropertyRequest request, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to modify this property.");
        }

        String newName = request.getName().trim();
        if (!property.getName().equalsIgnoreCase(newName) &&
                propertyRepository.existsByNameAndOwnerIdAndIdNot(newName, property.getOwner().getId(), propertyId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A property named '" + newName + "' already exists for this owner.");
        }

        // Validate that new totalFloors is not less than any existing room's floor
        int maxFloor = property.getRooms().stream()
                .mapToInt(Room::getFloor)
                .max()
                .orElse(0);

        if (request.getTotalFloors() < maxFloor) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Total floors (" + request.getTotalFloors() + ") cannot be less than highest existing room floor (" + maxFloor + ").");
        }

        property.setName(newName);
        property.setAddress(request.getAddress().trim());
        property.setCity(request.getCity().trim());
        property.setState(request.getState().trim());
        property.setTotalFloors(request.getTotalFloors());
        if (request.getBillingCyclePreference() != null) {
            property.setBillingCyclePreference(request.getBillingCyclePreference());
        }

        Property updatedProperty = propertyRepository.save(property);
        return PropertyResponse.fromEntity(updatedProperty);
    }

    @Override
    public void deleteProperty(Long propertyId) {
        deleteProperty(propertyId, null, null);
    }

    @Override
    public void deleteProperty(Long propertyId, String userEmail, boolean isSuperAdmin) {
        deleteProperty(propertyId, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private void deleteProperty(Long propertyId, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete this property.");
        }

        // Business Rule: Deletes property ONLY if there are no active beds in any of its rooms
        List<Bed> propertyBeds = bedRepository.findByRoomPropertyId(propertyId);
        List<Bed> activeBeds = propertyBeds.stream()
                .filter(bed -> bed.getStatus() == BedStatus.OCCUPIED || bed.getCurrentTenantId() != null)
                .toList();

        if (!activeBeds.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete property '" + property.getName() + "': There are " + activeBeds.size() +
                    " active/occupied bed(s) in this property. All beds must be vacant before deleting the property."
            );
        }

        propertyRepository.delete(property);
    }

    // =========================================================================
    // Room Update & Delete
    // =========================================================================

    @Override
    public RoomResponse updateRoom(Long roomId, UpdateRoomRequest request) {
        return updateRoom(roomId, request, null, null);
    }

    @Override
    public RoomResponse updateRoom(Long roomId, UpdateRoomRequest request, String userEmail, boolean isSuperAdmin) {
        return updateRoom(roomId, request, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private RoomResponse updateRoom(Long roomId, UpdateRoomRequest request, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found with ID: " + roomId));

        Property property = room.getProperty();
        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to modify rooms in this property.");
        }

        String newRoomNumber = request.getRoomNumber().trim();
        if (!room.getRoomNumber().equalsIgnoreCase(newRoomNumber) &&
                roomRepository.existsByPropertyIdAndRoomNumberAndIdNot(property.getId(), newRoomNumber, roomId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Room number '" + newRoomNumber + "' already exists in this property.");
        }

        if (request.getFloor() != null) {
            if (request.getFloor() > property.getTotalFloors()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Floor number (" + request.getFloor() + ") cannot exceed property total floors (" + property.getTotalFloors() + ").");
            }
            room.setFloor(request.getFloor());
        }

        if (request.getBaseRent() != null) {
            room.setBaseRent(request.getBaseRent());
        }

        if (request.getHasAc() != null) {
            room.setHasAc(request.getHasAc());
        }

        room.setRoomNumber(newRoomNumber);

        Room updatedRoom = roomRepository.save(room);
        return RoomResponse.fromEntity(updatedRoom);
    }

    @Override
    public void deleteRoom(Long roomId) {
        deleteRoom(roomId, null, null);
    }

    @Override
    public void deleteRoom(Long roomId, String userEmail, boolean isSuperAdmin) {
        deleteRoom(roomId, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private void deleteRoom(Long roomId, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Room room = roomRepository.findById(roomId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Room not found with ID: " + roomId));

        Property property = room.getProperty();
        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete rooms in this property.");
        }

        // Business Rule: Deletes the room ONLY if all beds inside are VACANT
        List<Bed> beds = bedRepository.findByRoomId(roomId);
        List<Bed> activeBeds = beds.stream()
                .filter(bed -> bed.getStatus() != BedStatus.VACANT || bed.getCurrentTenantId() != null)
                .toList();

        if (!activeBeds.isEmpty()) {
            throw new IllegalStateException(
                    "Cannot delete room '" + room.getRoomNumber() + "': Room contains " + activeBeds.size() +
                    " occupied or non-vacant bed(s). All beds inside must be VACANT before deleting the room."
            );
        }

        if (property.getRooms() != null) {
            property.getRooms().remove(room);
        }
        roomRepository.delete(room);
    }

    // =========================================================================
    // Bed Update & Delete
    // =========================================================================

    @Override
    public BedResponse updateBed(Long bedId, UpdateBedRequest request) {
        return updateBed(bedId, request, null, null);
    }

    @Override
    public BedResponse updateBed(Long bedId, UpdateBedRequest request, String userEmail, boolean isSuperAdmin) {
        return updateBed(bedId, request, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private BedResponse updateBed(Long bedId, UpdateBedRequest request, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bed not found with ID: " + bedId));

        Property property = bed.getRoom().getProperty();
        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to modify beds in this property.");
        }

        String newBedNumber = request.getBedNumber().trim();
        if (!bed.getBedNumber().equalsIgnoreCase(newBedNumber) &&
                bedRepository.existsByRoomIdAndBedNumberAndIdNot(bed.getRoom().getId(), newBedNumber, bedId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Bed number '" + newBedNumber + "' already exists in this room.");
        }

        bed.setBedNumber(newBedNumber);

        Bed updatedBed = bedRepository.save(bed);
        return BedResponse.fromEntity(updatedBed);
    }

    @Override
    public void deleteBed(Long bedId) {
        deleteBed(bedId, null, null);
    }

    @Override
    public void deleteBed(Long bedId, String userEmail, boolean isSuperAdmin) {
        deleteBed(bedId, userEmail, Boolean.valueOf(isSuperAdmin));
    }

    private void deleteBed(Long bedId, String userEmail, Boolean isSuperAdmin) {
        User user = getAuthenticatedUser(userEmail);
        boolean superAdmin = checkSuperAdmin(isSuperAdmin);

        Bed bed = bedRepository.findById(bedId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Bed not found with ID: " + bedId));

        Property property = bed.getRoom().getProperty();
        if (!superAdmin && !property.getOwner().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete beds in this property.");
        }

        // Business Rule: Deletes the bed ONLY if its status is VACANT. Throws an IllegalStateException if OCCUPIED.
        if (bed.getStatus() == BedStatus.OCCUPIED || bed.getCurrentTenantId() != null) {
            throw new IllegalStateException("Cannot delete bed '" + bed.getBedNumber() + "': Bed is currently OCCUPIED.");
        }

        if (bed.getStatus() != BedStatus.VACANT) {
            throw new IllegalStateException(
                    "Cannot delete bed '" + bed.getBedNumber() + "': Bed status must be VACANT (current status: " + bed.getStatus() + ")."
            );
        }

        Room room = bed.getRoom();
        if (room != null && room.getBeds() != null) {
            room.getBeds().remove(bed);
        }
        bedRepository.delete(bed);
    }

    // =========================================================================
    // Authentication & Authorization Helpers
    // =========================================================================

    private User getAuthenticatedUser(String userEmail) {
        if (userEmail == null || userEmail.isBlank()) {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                userEmail = auth.getName();
            }
        }

        if (userEmail == null || userEmail.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User authentication context is missing.");
        }

        final String emailToQuery = userEmail;
        return userRepository.findByEmail(emailToQuery)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found with email: " + emailToQuery));
    }

    private boolean checkSuperAdmin(Boolean isSuperAdmin) {
        if (isSuperAdmin != null) {
            return isSuperAdmin;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
