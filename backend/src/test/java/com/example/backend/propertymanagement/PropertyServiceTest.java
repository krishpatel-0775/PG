package com.example.backend.propertymanagement;

import com.example.backend.propertymanagement.dto.request.CreateRoomRequest;
import com.example.backend.propertymanagement.dto.request.UpdateBedRequest;
import com.example.backend.propertymanagement.dto.request.UpdatePropertyRequest;
import com.example.backend.propertymanagement.dto.request.UpdateRoomRequest;
import com.example.backend.propertymanagement.dto.response.BedResponse;
import com.example.backend.propertymanagement.dto.response.PropertyResponse;
import com.example.backend.propertymanagement.dto.response.RoomResponse;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.entity.RoomType;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.propertymanagement.repository.RoomRepository;
import com.example.backend.propertymanagement.service.impl.PropertyServiceImpl;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PropertyServiceTest {

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private RoomRepository roomRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PropertyServiceImpl propertyService;

    private User owner1;
    private User owner2;
    private Property property1;
    private Room room1;
    private Bed bed1;

    @BeforeEach
    void setUp() {
        owner1 = User.builder()
                .id(1L)
                .name("Owner One")
                .email("owner1@test.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        owner2 = User.builder()
                .id(2L)
                .name("Owner Two")
                .email("owner2@test.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        property1 = Property.builder()
                .id(10L)
                .name("Sunrise PG")
                .address("123 Tech Park Road")
                .city("Bangalore")
                .state("Karnataka")
                .totalFloors(3)
                .owner(owner1)
                .rooms(new ArrayList<>())
                .build();

        room1 = Room.builder()
                .id(20L)
                .property(property1)
                .roomNumber("101")
                .floor(1)
                .roomType(RoomType.SINGLE)
                .baseRent(8000.0)
                .hasAc(true)
                .beds(new ArrayList<>())
                .build();

        bed1 = Bed.builder()
                .id(30L)
                .room(room1)
                .bedNumber("101-A")
                .status(BedStatus.VACANT)
                .currentTenantId(null)
                .build();

        room1.getBeds().add(bed1);
        property1.getRooms().add(room1);
    }

    // =========================================================================
    // Property Tests
    // =========================================================================

    @Test
    @DisplayName("Should successfully update property if caller is owner")
    void testUpdateProperty_Success() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property1));
        when(propertyRepository.save(any(Property.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdatePropertyRequest request = UpdatePropertyRequest.builder()
                .name("Sunrise Luxury PG")
                .address("456 New Road")
                .city("Bangalore")
                .state("Karnataka")
                .totalFloors(4)
                .build();

        PropertyResponse response = propertyService.updateProperty(10L, request, "owner1@test.com", false);

        assertNotNull(response);
        assertEquals("Sunrise Luxury PG", response.getName());
        assertEquals("456 New Road", response.getAddress());
        assertEquals(4, response.getTotalFloors());
    }

    @Test
    @DisplayName("Should throw 403 Forbidden when updating property owned by someone else")
    void testUpdateProperty_Forbidden() {
        when(userRepository.findByEmail("owner2@test.com")).thenReturn(Optional.of(owner2));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property1));

        UpdatePropertyRequest request = UpdatePropertyRequest.builder()
                .name("Unauthorized Change")
                .address("456 New Road")
                .city("Bangalore")
                .state("Karnataka")
                .totalFloors(4)
                .build();

        assertThrows(ResponseStatusException.class, () ->
                propertyService.updateProperty(10L, request, "owner2@test.com", false));
    }

    @Test
    @DisplayName("Should successfully delete property when all beds in rooms are VACANT")
    void testDeleteProperty_Success() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property1));
        when(bedRepository.findByRoomPropertyId(10L)).thenReturn(List.of(bed1));

        assertDoesNotThrow(() -> propertyService.deleteProperty(10L, "owner1@test.com", false));
        verify(propertyRepository, times(1)).delete(property1);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when deleting property containing OCCUPIED bed")
    void testDeleteProperty_ThrowsWhenOccupied() {
        bed1.setStatus(BedStatus.OCCUPIED);
        bed1.setCurrentTenantId(99L);

        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property1));
        when(bedRepository.findByRoomPropertyId(10L)).thenReturn(List.of(bed1));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                propertyService.deleteProperty(10L, "owner1@test.com", false));

        assertTrue(ex.getMessage().contains("active/occupied bed"));
        verify(propertyRepository, never()).delete(any());
    }

    // =========================================================================
    // Room Tests
    // =========================================================================

    @Test
    @DisplayName("Should successfully create room with SIX_SHARING and provision 6 beds")
    void testCreateRoom_SixSharing_ProvisionsSixBeds() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(propertyRepository.findById(10L)).thenReturn(Optional.of(property1));
        when(roomRepository.existsByPropertyIdAndRoomNumber(10L, "205")).thenReturn(false);
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(bedRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));

        CreateRoomRequest request = CreateRoomRequest.builder()
                .roomNumber("205")
                .floor(1)
                .roomType(RoomType.SIX_SHARING)
                .baseRent(6000.0)
                .hasAc(true)
                .build();

        RoomResponse response = propertyService.createRoom(10L, request, "owner1@test.com", false);

        assertNotNull(response);
        assertEquals("205", response.getRoomNumber());
        assertEquals(RoomType.SIX_SHARING, response.getRoomType());
        assertEquals(6, response.getCapacity());
        assertEquals(6, response.getBeds().size());
        assertEquals("205-A", response.getBeds().get(0).getBedNumber());
        assertEquals("205-F", response.getBeds().get(5).getBedNumber());
    }

    @Test
    @DisplayName("Should successfully update room identifier")
    void testUpdateRoom_Success() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room1));
        when(roomRepository.save(any(Room.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateRoomRequest request = UpdateRoomRequest.builder()
                .roomNumber("101-Renovated")
                .floor(2)
                .baseRent(9500.0)
                .hasAc(true)
                .build();

        RoomResponse response = propertyService.updateRoom(20L, request, "owner1@test.com", false);

        assertNotNull(response);
        assertEquals("101-Renovated", response.getRoomNumber());
        assertEquals(2, response.getFloor());
        assertEquals(9500.0, response.getBaseRent());
    }

    @Test
    @DisplayName("Should successfully delete room when all beds are VACANT")
    void testDeleteRoom_Success() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room1));
        when(bedRepository.findByRoomId(20L)).thenReturn(List.of(bed1));

        assertDoesNotThrow(() -> propertyService.deleteRoom(20L, "owner1@test.com", false));
        verify(roomRepository, times(1)).delete(room1);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when deleting room with non-vacant bed")
    void testDeleteRoom_ThrowsWhenNotVacant() {
        bed1.setStatus(BedStatus.OCCUPIED);
        bed1.setCurrentTenantId(88L);

        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(roomRepository.findById(20L)).thenReturn(Optional.of(room1));
        when(bedRepository.findByRoomId(20L)).thenReturn(List.of(bed1));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                propertyService.deleteRoom(20L, "owner1@test.com", false));

        assertTrue(ex.getMessage().contains("must be VACANT"));
        verify(roomRepository, never()).delete(any());
    }

    // =========================================================================
    // Bed Tests
    // =========================================================================

    @Test
    @DisplayName("Should successfully update bed identifier")
    void testUpdateBed_Success() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(bedRepository.findById(30L)).thenReturn(Optional.of(bed1));
        when(bedRepository.save(any(Bed.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateBedRequest request = UpdateBedRequest.builder()
                .bedNumber("101-DELUXE-A")
                .build();

        BedResponse response = propertyService.updateBed(30L, request, "owner1@test.com", false);

        assertNotNull(response);
        assertEquals("101-DELUXE-A", response.getBedNumber());
    }

    @Test
    @DisplayName("Should successfully delete bed when status is VACANT")
    void testDeleteBed_SuccessWhenVacant() {
        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(bedRepository.findById(30L)).thenReturn(Optional.of(bed1));

        assertDoesNotThrow(() -> propertyService.deleteBed(30L, "owner1@test.com", false));
        verify(bedRepository, times(1)).delete(bed1);
    }

    @Test
    @DisplayName("Should throw IllegalStateException when deleting OCCUPIED bed")
    void testDeleteBed_ThrowsWhenOccupied() {
        bed1.setStatus(BedStatus.OCCUPIED);
        bed1.setCurrentTenantId(77L);

        when(userRepository.findByEmail("owner1@test.com")).thenReturn(Optional.of(owner1));
        when(bedRepository.findById(30L)).thenReturn(Optional.of(bed1));

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                propertyService.deleteBed(30L, "owner1@test.com", false));

        assertTrue(ex.getMessage().contains("Bed is currently OCCUPIED"));
        verify(bedRepository, never()).delete(any());
    }
}
