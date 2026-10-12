package com.example.backend.tenantmanagement;

import com.example.backend.communication.service.NotificationService;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.tenantmanagement.dto.request.TransferBedRequest;
import com.example.backend.tenantmanagement.dto.response.AllocationResponse;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.tenantmanagement.service.impl.AllocationServiceImpl;
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
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AllocationTransferTest {

    @Mock
    private AllocationRepository allocationRepository;

    @Mock
    private BedRepository bedRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private NotificationService notificationService;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private AllocationServiceImpl allocationService;

    private User owner;
    private User otherOwner;
    private User tenant;
    private Property property;
    private Room room101;
    private Room room202;
    private Bed oldBed;
    private Bed newBed;
    private Allocation currentAllocation;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Owner Raj")
                .email("raj@pg.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        otherOwner = User.builder()
                .id(99L)
                .name("Other Owner")
                .email("other@pg.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        tenant = User.builder()
                .id(10L)
                .name("Rahul Sharma")
                .email("rahul@example.com")
                .phone("9876543210")
                .role(Role.ROLE_TENANT)
                .build();

        property = Property.builder()
                .id(100L)
                .name("Sunshine PG")
                .owner(owner)
                .build();

        room101 = Room.builder()
                .id(101L)
                .roomNumber("101")
                .property(property)
                .baseRent(7000.0)
                .build();

        room202 = Room.builder()
                .id(202L)
                .roomNumber("202")
                .property(property)
                .baseRent(8500.0)
                .build();

        oldBed = Bed.builder()
                .id(1L)
                .bedNumber("B1")
                .room(room101)
                .status(BedStatus.OCCUPIED)
                .currentTenantId(10L)
                .build();

        newBed = Bed.builder()
                .id(2L)
                .bedNumber("B2")
                .room(room202)
                .status(BedStatus.VACANT)
                .build();

        currentAllocation = Allocation.builder()
                .id(50L)
                .tenant(tenant)
                .bed(oldBed)
                .checkInDate(LocalDate.of(2026, 1, 1))
                .monthlyRent(new BigDecimal("7000.00"))
                .depositAmount(new BigDecimal("14000.00"))
                .status(AllocationStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Seamless transfer updates beds, completes old allocation, creates new allocation, and carries forward deposit & invoices")
    void testTransferBed_Success() {
        when(userRepository.findByEmail("raj@pg.com")).thenReturn(Optional.of(owner));
        when(allocationRepository.findById(50L)).thenReturn(Optional.of(currentAllocation));
        when(bedRepository.findById(2L)).thenReturn(Optional.of(newBed));

        // Mock saving new allocation
        when(allocationRepository.save(any(Allocation.class))).thenAnswer(invocation -> {
            Allocation saved = invocation.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(51L);
            }
            return saved;
        });

        // Unpaid invoice on old allocation
        Invoice unpaidInvoice = Invoice.builder()
                .id(301L)
                .allocation(currentAllocation)
                .status(InvoiceStatus.UNPAID)
                .totalAmount(new BigDecimal("7000.00"))
                .amountPaid(BigDecimal.ZERO)
                .build();
        when(invoiceRepository.findByAllocationId(50L)).thenReturn(List.of(unpaidInvoice));

        TransferBedRequest request = TransferBedRequest.builder()
                .newBedId(2L)
                .transferDeposit(true)
                .transferUnpaidInvoices(true)
                .transferDate(LocalDate.of(2026, 3, 1))
                .reason("Moved to single room on 2nd floor")
                .build();

        AllocationResponse response = allocationService.transferBed(50L, request, "raj@pg.com", false);

        assertNotNull(response);
        assertEquals(51L, response.getId());
        assertEquals("202", response.getRoomNumber());
        assertEquals("B2", response.getBedNumber());
        assertEquals(0, new BigDecimal("8500.00").compareTo(response.getMonthlyRent())); // from room 202 base rent
        assertEquals(0, new BigDecimal("14000.00").compareTo(response.getDepositAmount())); // carried forward
        assertEquals(AllocationStatus.ACTIVE, response.getStatus());

        // Verify old bed freed
        assertEquals(BedStatus.VACANT, oldBed.getStatus());
        assertNull(oldBed.getCurrentTenantId());

        // Verify new bed occupied
        assertEquals(BedStatus.OCCUPIED, newBed.getStatus());
        assertEquals(10L, newBed.getCurrentTenantId());

        // Verify old allocation completed
        assertEquals(AllocationStatus.COMPLETED, currentAllocation.getStatus());
        assertEquals(LocalDate.of(2026, 3, 1), currentAllocation.getCheckOutDate());

        // Verify unpaid invoice re-linked
        assertEquals(51L, unpaidInvoice.getAllocation().getId());
        verify(invoiceRepository).saveAll(anyList());

        // Verify notification sent
        verify(notificationService).sendRoomTransferNotification(any(Allocation.class), eq("101"), eq("B1"));
    }

    @Test
    @DisplayName("Transfer throws Conflict 409 if target bed is already OCCUPIED")
    void testTransferBed_TargetBedOccupied_ThrowsConflict() {
        when(userRepository.findByEmail("raj@pg.com")).thenReturn(Optional.of(owner));
        when(allocationRepository.findById(50L)).thenReturn(Optional.of(currentAllocation));

        newBed.setStatus(BedStatus.OCCUPIED);
        when(bedRepository.findById(2L)).thenReturn(Optional.of(newBed));

        TransferBedRequest request = TransferBedRequest.builder()
                .newBedId(2L)
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> allocationService.transferBed(50L, request, "raj@pg.com", false));

        assertEquals(HttpStatus.CONFLICT, ex.getStatusCode());
        assertTrue(ex.getReason().contains("is not vacant"));
    }

    @Test
    @DisplayName("Transfer throws Bad Request 400 if target bed is same as current bed")
    void testTransferBed_SameBed_ThrowsBadRequest() {
        when(userRepository.findByEmail("raj@pg.com")).thenReturn(Optional.of(owner));
        when(allocationRepository.findById(50L)).thenReturn(Optional.of(currentAllocation));

        TransferBedRequest request = TransferBedRequest.builder()
                .newBedId(1L) // same as oldBed.getId()
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> allocationService.transferBed(50L, request, "raj@pg.com", false));

        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Target bed cannot be the same as the current bed"));
    }

    @Test
    @DisplayName("Transfer throws Forbidden 403 if caller is not the owner of property")
    void testTransferBed_UnauthorizedCaller_ThrowsForbidden() {
        when(userRepository.findByEmail("other@pg.com")).thenReturn(Optional.of(otherOwner));
        when(allocationRepository.findById(50L)).thenReturn(Optional.of(currentAllocation));

        TransferBedRequest request = TransferBedRequest.builder()
                .newBedId(2L)
                .build();

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> allocationService.transferBed(50L, request, "other@pg.com", false));

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    }
}
