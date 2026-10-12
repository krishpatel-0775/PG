package com.example.backend.ai.tool;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.*;

/**
 * Tool for retrieving and calculating pending fees, overdue rent, and payment defaulters.
 * Strictly scopes data to owner properties or the tenant's own records.
 */
@Component
public class PendingInvoicesTool implements AiTool {

    private final InvoiceRepository invoiceRepository;
    private static final List<InvoiceStatus> UNPAID_STATUSES = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

    public PendingInvoicesTool(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public String getName() {
        return "getPendingInvoices";
    }

    @Override
    public String getDescription() {
        return "Retrieves outstanding rent dues, unpaid invoices, and payment defaulters with exact INR amounts.";
    }

    @Override
    public boolean isAuthorized(User user) {
        // Accessible by all authenticated roles, but internally scoped
        return user != null && user.getRole() != null;
    }

    @Override
    public ToolExecutionResult execute(User user, Map<String, Object> parameters) {
        Role role = user.getRole();
        List<Invoice> invoices;

        if (role == Role.ROLE_SUPER_ADMIN) {
            invoices = invoiceRepository.findByStatusIn(UNPAID_STATUSES);
        } else if (role == Role.ROLE_PG_OWNER || role == Role.ROLE_STAFF) {
            invoices = invoiceRepository.findByAllocationBedRoomPropertyOwnerIdAndStatusIn(user.getId(), UNPAID_STATUSES);
        } else if (role == Role.ROLE_TENANT) {
            invoices = invoiceRepository.findByAllocationTenantIdAndStatusIn(user.getId(), UNPAID_STATUSES);
        } else {
            return ToolExecutionResult.failure(getName(), "Unauthorized role for invoice operations: " + role);
        }

        if (invoices == null || invoices.isEmpty()) {
            String emptyMsg = (role == Role.ROLE_TENANT)
                    ? "You have 0 pending dues. All your rent invoices are completely paid up!"
                    : "No pending or overdue invoices found across your properties. All tenants are up-to-date!";
            return ToolExecutionResult.empty(getName(), emptyMsg);
        }

        BigDecimal totalOutstanding = BigDecimal.ZERO;
        BigDecimal totalBilled = BigDecimal.ZERO;
        List<Map<String, Object>> invoiceItems = new ArrayList<>();
        StringBuilder summary = new StringBuilder();
        summary.append("### 💳 Outstanding Invoices & Dues Summary\n");
        summary.append("Found ").append(invoices.size()).append(" pending invoice(s):\n\n");

        int limit = Math.min(invoices.size(), 30);
        for (int i = 0; i < limit; i++) {
            Invoice inv = invoices.get(i);
            BigDecimal total = inv.getTotalAmount() != null ? inv.getTotalAmount() : BigDecimal.ZERO;
            BigDecimal paid = inv.getAmountPaid() != null ? inv.getAmountPaid() : BigDecimal.ZERO;
            BigDecimal due = total.subtract(paid).max(BigDecimal.ZERO);

            totalOutstanding = totalOutstanding.add(due);
            totalBilled = totalBilled.add(total);

            String tenantName = "Tenant";
            String tenantPhone = "N/A";
            String propName = "Property";
            String roomNo = "N/A";
            String bedNo = "N/A";

            if (inv.getAllocation() != null) {
                if (inv.getAllocation().getTenant() != null) {
                    tenantName = inv.getAllocation().getTenant().getName();
                    String rawPhone = inv.getAllocation().getTenant().getPhone();
                    tenantPhone = maskPhone(rawPhone);
                }
                if (inv.getAllocation().getBed() != null) {
                    bedNo = inv.getAllocation().getBed().getBedNumber();
                    if (inv.getAllocation().getBed().getRoom() != null) {
                        roomNo = inv.getAllocation().getBed().getRoom().getRoomNumber();
                        if (inv.getAllocation().getBed().getRoom().getProperty() != null) {
                            propName = inv.getAllocation().getBed().getRoom().getProperty().getName();
                        }
                    }
                }
            }

            String monthStr = inv.getInvoiceMonth() != null ? inv.getInvoiceMonth() : (inv.getInvoiceDate() != null ? inv.getInvoiceDate().toString() : "N/A");

            summary.append("- **").append(tenantName).append("**");
            if (role != Role.ROLE_TENANT) {
                summary.append(" (").append(tenantPhone).append(")");
            }
            summary.append(" | ").append(propName).append(" (Rm ").append(roomNo).append(", Bed ").append(bedNo).append(")")
                    .append(" | Month: ").append(monthStr)
                    .append(" | Due: **₹").append(formatInr(due)).append("**")
                    .append(" (Total ₹").append(formatInr(total)).append(", Paid ₹").append(formatInr(paid)).append(")")
                    .append(" | Status: ").append(inv.getStatus().name())
                    .append("\n");

            Map<String, Object> item = new HashMap<>();
            item.put("invoiceId", inv.getId());
            item.put("tenantName", tenantName);
            item.put("dueAmount", due);
            item.put("status", inv.getStatus().name());
            item.put("dueDate", inv.getDueDate());
            invoiceItems.add(item);
        }

        if (invoices.size() > limit) {
            summary.append("  * ...and ").append(invoices.size() - limit).append(" more unpaid invoices.\n");
        }

        summary.append("\n**Total Outstanding Due:** ₹").append(formatInr(totalOutstanding)).append("\n");

        Map<String, Object> data = new HashMap<>();
        data.put("totalPendingAmount", totalOutstanding);
        data.put("totalBilledAmount", totalBilled);
        data.put("pendingCount", invoices.size());
        data.put("invoices", invoiceItems);

        return ToolExecutionResult.builder()
                .toolName(getName())
                .success(true)
                .summaryText(summary.toString())
                .structuredData(data)
                .recordCount(invoices.size())
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 5) return "N/A";
        int len = phone.length();
        return "******" + phone.substring(len - 4);
    }

    private String formatInr(BigDecimal amount) {
        if (amount == null) return "0.00";
        return amount.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}
