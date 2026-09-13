package com.example.backend.financemanagement;

import com.example.backend.communication.service.NotificationService;
import com.example.backend.financemanagement.dto.response.InvoiceResponse;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.entity.InvoiceType;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.financemanagement.repository.PaymentRepository;
import com.example.backend.financemanagement.service.impl.FinanceServiceImpl;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BillingCycleType;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class FinanceServiceBillingCycleTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private AllocationRepository allocationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private FinanceServiceImpl financeService;

    private User tenant;
    private Property anniversaryProperty;
    private Property firstOfMonthProperty;

    @BeforeEach
    void setUp() {
        tenant = User.builder()
                .id(1L)
                .name("Tenant One")
                .email("tenant@test.com")
                .build();

        anniversaryProperty = Property.builder()
                .id(10L)
                .name("Anniversary Heights")
                .billingCyclePreference(BillingCycleType.ANNIVERSARY)
                .build();

        firstOfMonthProperty = Property.builder()
                .id(20L)
                .name("First Of Month Place")
                .billingCyclePreference(BillingCycleType.FIRST_OF_MONTH)
                .build();
    }

    private Allocation createMockAllocation(Long id, Property property, LocalDate checkInDate) {
        Room room = Room.builder().id(100L + id).property(property).build();
        Bed bed = Bed.builder().id(1000L + id).room(room).build();
        return Allocation.builder()
                .id(id)
                .tenant(tenant)
                .bed(bed)
                .checkInDate(checkInDate)
                .monthlyRent(new BigDecimal("8000.00"))
                .status(AllocationStatus.ACTIVE)
                .build();
    }

    @Test
    @DisplayName("Should generate invoices according to ANNIVERSARY and FIRST_OF_MONTH rules")
    void testGenerateDailyInvoices_FlexibleBillingCycles() {
        LocalDate today = LocalDate.now();

        // 1. Anniversary allocation whose anniversary day matches today
        Allocation matchingAnniversary = createMockAllocation(
                1L,
                anniversaryProperty,
                today.minusMonths(2) // 2 months ago on the same day-of-month
        );

        // 2. Anniversary allocation created in the current month (should be skipped as anniversary starts next month)
        Allocation newCheckInThisMonth = createMockAllocation(
                2L,
                anniversaryProperty,
                today // checked in today
        );

        // 3. First of Month allocation
        Allocation firstOfMonthAllocation = createMockAllocation(
                3L,
                firstOfMonthProperty,
                today.minusMonths(1).withDayOfMonth(15) // checked in last month on the 15th
        );

        when(allocationRepository.findByStatusIn(any())).thenReturn(
                List.of(matchingAnniversary, newCheckInThisMonth, firstOfMonthAllocation)
        );
        when(invoiceRepository.existsByAllocationIdAndInvoiceDate(any(), eq(today))).thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class))).thenAnswer(invocation -> {
            Invoice inv = invocation.getArgument(0);
            inv.setId(900L);
            return inv;
        });

        List<InvoiceResponse> responses = financeService.generateDailyInvoices();

        assertNotNull(responses);

        // Allocation 1 (matching anniversary) should always be billed today
        verify(invoiceRepository, atLeastOnce()).save(argThat(inv ->
                inv.getAllocation().getId().equals(1L) &&
                inv.getTotalAmount().compareTo(new BigDecimal("8000.00")) == 0
        ));

        // Allocation 2 (checked in this month) should NOT be billed today
        verify(invoiceRepository, never()).save(argThat(inv ->
                inv.getAllocation().getId().equals(2L)
        ));

        // Allocation 3 (FIRST_OF_MONTH) should only be billed if today is day 1
        if (today.getDayOfMonth() == 1) {
            verify(invoiceRepository).save(argThat(inv ->
                    inv.getAllocation().getId().equals(3L)
            ));
        } else {
            verify(invoiceRepository, never()).save(argThat(inv ->
                    inv.getAllocation().getId().equals(3L)
            ));
        }
    }
}
