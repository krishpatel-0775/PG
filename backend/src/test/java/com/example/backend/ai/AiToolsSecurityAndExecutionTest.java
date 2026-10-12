package com.example.backend.ai;

import com.example.backend.ai.tool.*;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.entity.Room;
import com.example.backend.propertymanagement.repository.BedRepository;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiToolsSecurityAndExecutionTest {

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PropertyRepository propertyRepository;

    @Mock
    private BedRepository bedRepository;

    private PendingInvoicesTool pendingInvoicesTool;
    private RevenueSummaryTool revenueSummaryTool;
    private VacantBedsTool vacantBedsTool;
    private AiToolRegistry toolRegistry;

    private User owner;
    private User tenant;

    @BeforeEach
    void setUp() {
        pendingInvoicesTool = new PendingInvoicesTool(invoiceRepository);
        revenueSummaryTool = new RevenueSummaryTool(invoiceRepository);
        vacantBedsTool = new VacantBedsTool(propertyRepository, bedRepository);

        toolRegistry = new AiToolRegistry(List.of(pendingInvoicesTool, revenueSummaryTool, vacantBedsTool));

        owner = User.builder()
                .id(1L)
                .name("Mr. Owner")
                .email("owner@pg.com")
                .role(Role.ROLE_PG_OWNER)
                .build();

        tenant = User.builder()
                .id(2L)
                .name("Alice Tenant")
                .email("alice@tenant.com")
                .role(Role.ROLE_TENANT)
                .build();
    }

    @Test
    @DisplayName("Security: Tenant is strictly forbidden from executing RevenueSummaryTool")
    void testTenantCannotAccessRevenueSummary() {
        assertFalse(revenueSummaryTool.isAuthorized(tenant), "Tenants must never be authorized to view revenue");

        ToolExecutionResult result = toolRegistry.executeTool("getRevenueSummary", tenant, Map.of());
        assertFalse(result.isSuccess(), "Execution must fail for unauthorized tenant");
        assertTrue(result.getErrorMessage().contains("Access Denied") || result.getErrorMessage().contains("Access denied"));
        verifyNoInteractions(invoiceRepository);
    }

    @Test
    @DisplayName("Security: Owner can access RevenueSummaryTool and metrics are calculated correctly")
    void testOwnerCanAccessRevenueSummary() {
        assertTrue(revenueSummaryTool.isAuthorized(owner));

        when(invoiceRepository.sumAmountPaidByOwnerIdAndInvoiceDateBetween(eq(1L), any(), any()))
                .thenReturn(new BigDecimal("150000.00"));
        when(invoiceRepository.sumOutstandingDuesByOwnerIdAndStatusIn(eq(1L), any()))
                .thenReturn(new BigDecimal("25000.00"));

        ToolExecutionResult result = toolRegistry.executeTool("getRevenueSummary", owner, Map.of());
        assertTrue(result.isSuccess());
        assertNotNull(result.getStructuredData());
        assertEquals(new BigDecimal("150000.00"), result.getStructuredData().get("monthlyCollected"));
        assertEquals(new BigDecimal("25000.00"), result.getStructuredData().get("totalOutstanding"));
    }

    @Test
    @DisplayName("Security: Phone numbers are masked in PendingInvoicesTool to protect tenant privacy")
    void testPendingInvoicesMasksPhoneNumbers() {
        User tenantWithPhone = User.builder()
                .id(5L)
                .name("John Resident")
                .phone("9876543210")
                .build();

        Allocation alloc = Allocation.builder()
                .tenant(tenantWithPhone)
                .build();

        Invoice invoice = Invoice.builder()
                .id(101L)
                .allocation(alloc)
                .totalAmount(new BigDecimal("8000.00"))
                .amountPaid(new BigDecimal("3000.00"))
                .status(InvoiceStatus.PARTIALLY_PAID)
                .dueDate(LocalDate.now().plusDays(5))
                .build();

        when(invoiceRepository.findByAllocationBedRoomPropertyOwnerIdAndStatusIn(eq(1L), any()))
                .thenReturn(List.of(invoice));

        ToolExecutionResult result = pendingInvoicesTool.execute(owner, Map.of());

        assertTrue(result.isSuccess());
        // Verify phone is masked with asterisks and does NOT expose full 9876543210
        assertFalse(result.getSummaryText().contains("9876543210"), "Full phone number must not be exposed in LLM context");
        assertTrue(result.getSummaryText().contains("******3210"), "Phone must be securely masked");
        assertTrue(result.getSummaryText().contains("₹5000.00"), "Remaining due should be ₹5000.00");
    }

    @Test
    @DisplayName("Security: Tenant only receives their own invoices in PendingInvoicesTool")
    void testTenantScopedInvoiceQuery() {
        when(invoiceRepository.findByAllocationTenantIdAndStatusIn(eq(2L), any()))
                .thenReturn(List.of());

        ToolExecutionResult result = pendingInvoicesTool.execute(tenant, Map.of());

        assertTrue(result.isSuccess());
        assertTrue(result.getSummaryText().contains("0 pending dues"), "Empty response should be reassuring for tenant");
        verify(invoiceRepository).findByAllocationTenantIdAndStatusIn(eq(2L), any());
        verify(invoiceRepository, never()).findByAllocationBedRoomPropertyOwnerIdAndStatusIn(any(), any());
    }

    @Test
    @DisplayName("Registry: Rejects unapproved tool names cleanly")
    void testRegistryRejectsUnapprovedTool() {
        ToolExecutionResult result = toolRegistry.executeTool("dropDatabaseTables", owner, Map.of());
        assertFalse(result.isSuccess());
        assertTrue(result.getErrorMessage().contains("Unapproved tool"));
    }
}
