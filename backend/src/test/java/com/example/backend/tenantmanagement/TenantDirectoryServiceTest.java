package com.example.backend.tenantmanagement;


import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.tenantmanagement.dto.response.TenantListResponse;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.tenantmanagement.service.impl.TenantDirectoryServiceImpl;
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

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TenantDirectoryServiceTest {

    @Mock
    private AllocationRepository allocationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @InjectMocks
    private TenantDirectoryServiceImpl tenantDirectoryService;

    private User owner;
    private User tenant1;
    private User tenant2;
    private Property property;
    private Room room;
    private Bed bed;

    @BeforeEach
    void setUp() {
        owner = User.builder()
                .id(1L)
                .name("Owner")
                .email("owner@test.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        tenant1 = User.builder()
                .id(2L)
                .name("Ansh Patel")
                .email("ansh@test.com")
                .phone("9876543210")
                .role(Role.ROLE_TENANT)
                .build();

        tenant2 = User.builder()
                .id(3L)
                .name("Ravi Kumar")
                .email("ravi@test.com")
                .phone("9876543211")
                .role(Role.ROLE_TENANT)
                .build();

        property = Property.builder()
                .id(1L)
                .name("Radhe PG")
                .owner(owner)
                .build();

        room = Room.builder()
                .id(1L)
                .roomNumber("101")
                .property(property)
                .build();

        bed = Bed.builder()
                .id(1L)
                .bedNumber("Bed-A")
                .room(room)
                .build();
    }

    @Test
    @DisplayName("getAllTenantsForOwner should deduplicate multiple allocations for the same tenant and prioritize ACTIVE stay")
    void testGetAllTenantsForOwner_DeduplicatesMultipleAllocations() {
        // Tenant 1 has 3 allocations (2 past, 1 active)
        Allocation alloc1 = Allocation.builder()
                .id(101L)
                .tenant(tenant1)
                .bed(bed)
                .checkInDate(LocalDate.of(2026, 8, 13))
                .status(AllocationStatus.COMPLETED)
                .build();

        Allocation alloc2 = Allocation.builder()
                .id(102L)
                .tenant(tenant1)
                .bed(bed)
                .checkInDate(LocalDate.of(2026, 9, 13))
                .status(AllocationStatus.COMPLETED)
                .build();

        Allocation alloc3 = Allocation.builder()
                .id(103L)
                .tenant(tenant1)
                .bed(bed)
                .checkInDate(LocalDate.of(2026, 9, 13))
                .status(AllocationStatus.ACTIVE)
                .build();

        // Tenant 2 has 1 past allocation
        Allocation alloc4 = Allocation.builder()
                .id(104L)
                .tenant(tenant2)
                .bed(bed)
                .checkInDate(LocalDate.of(2026, 7, 1))
                .status(AllocationStatus.COMPLETED)
                .build();

        when(userRepository.findByEmail("owner@test.com")).thenReturn(Optional.of(owner));
        when(allocationRepository.findByBedRoomPropertyOwnerId(1L))
                .thenReturn(Arrays.asList(alloc1, alloc2, alloc3, alloc4));

        List<TenantListResponse> result = tenantDirectoryService.getAllTenantsForOwner("owner@test.com", false);

        // Assert only 2 unique tenants are returned (not 4 allocations!)
        assertEquals(2, result.size());

        // First tenant should be Tenant 1 (Active resident)
        TenantListResponse first = result.get(0);
        assertEquals(2L, first.getTenantId());
        assertEquals("Ansh Patel", first.getName());
        assertEquals("ACTIVE", first.getAllocationStatus());
        assertEquals("Room 101 • Bed Bed-A", first.getCurrentRoomBed());
        assertEquals("Radhe PG", first.getCurrentPropertyName());

        // Second tenant should be Tenant 2 (Past resident)
        TenantListResponse second = result.get(1);
        assertEquals(3L, second.getTenantId());
        assertEquals("Ravi Kumar", second.getName());
        assertEquals("COMPLETED", second.getAllocationStatus());
    }
}
