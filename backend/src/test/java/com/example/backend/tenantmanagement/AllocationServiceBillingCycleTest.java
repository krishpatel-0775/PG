package com.example.backend.tenantmanagement;

import com.example.backend.communication.service.NotificationService;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.entity.InvoiceType;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.BillingCycleType;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.tenantmanagement.dto.request.CreateAllocationRequest;
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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AllocationServiceBillingCycleTest {

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
    private User tenant;
    private Property anniversaryProperty;
    private Property firstOfMonthProperty;
    private Room anniversaryRoom;
    private Room firstOfMonthRoom;
    private Bed anniversaryBed;
    private Bed firstOfMonthBed;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Property Owner")
                .email("owner@test.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        tenant = User.builder()
                .id(2L)
                .name("John Doe")
                .email("tenant@test.com")
                .phone("9876543210")
                .role(Role.ROLE_TENANT)
                .build();

        anniversaryProperty = Property.builder()
                .id(10L)
                .name("Anniversary Villa")
                .owner(owner)
                .billingCyclePreference(BillingCycleType.ANNIVERSARY)
                .rooms(new ArrayList<>())
                .build();

        anniversaryRoom = Room.builder()
                .id(100L)
                .property(anniversaryProperty)
                .roomNumber("A-101")
                .beds(new ArrayList<>())
                .build();

        anniversaryBed = Bed.builder()
                .id(1000L)
                .bedNumber("B1")
                .status(BedStatus.VACANT)
                .room(anniversaryRoom)
                .build();
        anniversaryRoom.getBeds().add(anniversaryBed);

        firstOfMonthProperty = Property.builder()
                .id(20L)
                .name("First Of Month Towers")
                .owner(owner)
                .billingCyclePreference(BillingCycleType.FIRST_OF_MONTH)
                .rooms(new ArrayList<>())
                .build();

        firstOfMonthRoom = Room.builder()
                .id(200L)
                .property(firstOfMonthProperty)
                .roomNumber("F-101")
                .beds(new ArrayList<>())
                .build();

        firstOfMonthBed = Bed.builder()
                .id(2000L)
                .bedNumber("B2")
                .status(BedStatus.VACANT)
                .room(firstOfMonthRoom)
                .build();
        firstOfMonthRoom.getBeds().add(firstOfMonthBed);
    }

    @Test
    @DisplayName("Should NOT generate immediate invoice when allocating bed in ANNIVERSARY property")
    void testAllocateBed_AnniversaryCycle_NoImmediateInvoice() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(tenant));
        when(allocationRepository.existsByTenantIdAndStatusIn(eq(2L), any())).thenReturn(false);
        when(bedRepository.findById(1000L)).thenReturn(Optional.of(anniversaryBed));
        when(allocationRepository.save(any(Allocation.class))).thenAnswer(invocation -> {
            Allocation a = invocation.getArgument(0);
            a.setId(500L);
            return a;
        });

        CreateAllocationRequest request = CreateAllocationRequest.builder()
                .tenantId(2L)
                .bedId(1000L)
                .checkInDate(LocalDate.of(2026, 9, 16))
                .depositAmount(new BigDecimal("15000.00"))
                .monthlyRent(new BigDecimal("10000.00"))
                .build();

        AllocationResponse response = allocationService.allocateBed(request, "owner@test.com", false);

        assertNotNull(response);
        assertEquals(500L, response.getId());
        assertEquals(BedStatus.OCCUPIED, anniversaryBed.getStatus());
        verify(invoiceRepository, never()).save(any(Invoice.class));
        verify(notificationService, never()).sendInvoiceGeneratedNotification(any(Invoice.class));
    }

    @Test
    @DisplayName("Should generate immediate prorated invoice when allocating bed in FIRST_OF_MONTH property")
    void testAllocateBed_FirstOfMonthCycle_GeneratesProratedInvoice() {
        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(userRepository.findById(2L)).thenReturn(Optional.of(tenant));
        when(allocationRepository.existsByTenantIdAndStatusIn(eq(2L), any())).thenReturn(false);
        when(bedRepository.findById(2000L)).thenReturn(Optional.of(firstOfMonthBed));
        when(allocationRepository.save(any(Allocation.class))).thenAnswer(invocation -> {
            Allocation a = invocation.getArgument(0);
            a.setId(501L);
            return a;
        });
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // September 2026 has 30 days.
        // Check-in on 16th -> 30 - 16 + 1 = 15 remaining days.
        // Rent = 10,000. Prorated rent = (10000 / 30) * 15 = 5000.00.
        LocalDate checkInDate = LocalDate.of(2026, 9, 16);
        CreateAllocationRequest request = CreateAllocationRequest.builder()
                .tenantId(2L)
                .bedId(2000L)
                .checkInDate(checkInDate)
                .depositAmount(new BigDecimal("15000.00"))
                .monthlyRent(new BigDecimal("10000.00"))
                .build();

        AllocationResponse response = allocationService.allocateBed(request, "owner@test.com", false);

        assertNotNull(response);
        assertEquals(501L, response.getId());
        assertEquals(BedStatus.OCCUPIED, firstOfMonthBed.getStatus());

        ArgumentCaptor<Invoice> invoiceCaptor = ArgumentCaptor.forClass(Invoice.class);
        verify(invoiceRepository, times(1)).save(invoiceCaptor.capture());

        Invoice savedInvoice = invoiceCaptor.getValue();
        assertEquals(new BigDecimal("5000.00"), savedInvoice.getTotalAmount());
        assertEquals(checkInDate, savedInvoice.getInvoiceDate());
        assertEquals(checkInDate.plusDays(5), savedInvoice.getDueDate());
        assertEquals(InvoiceType.RENT, savedInvoice.getInvoiceType());
        assertEquals(InvoiceStatus.UNPAID, savedInvoice.getStatus());
        assertEquals(checkInDate.format(java.time.format.DateTimeFormatter.ofPattern("MMM-yyyy")), savedInvoice.getInvoiceMonth());

        verify(notificationService, times(1)).sendInvoiceGeneratedNotification(savedInvoice);
    }
}
