package com.example.backend.ai.tool;

import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.*;

/**
 * Tool for calculating financial revenue, rent collections, and outstanding sums.
 * STRICTLY restricted from Tenant role access.
 */
@Component
public class RevenueSummaryTool implements AiTool {

    private final InvoiceRepository invoiceRepository;
    private static final List<InvoiceStatus> UNPAID_STATUSES = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

    public RevenueSummaryTool(InvoiceRepository invoiceRepository) {
        this.invoiceRepository = invoiceRepository;
    }

    @Override
    public String getName() {
        return "getRevenueSummary";
    }

    @Override
    public String getDescription() {
        return "Calculates total collected revenue, monthly income, outstanding dues, and collection efficiency.";
    }

    @Override
    public boolean isAuthorized(User user) {
        if (user == null || user.getRole() == null) return false;
        // Strictly restricted from Tenants
        return user.getRole() == Role.ROLE_SUPER_ADMIN
                || user.getRole() == Role.ROLE_PG_OWNER
                || user.getRole() == Role.ROLE_STAFF;
    }

    @Override
    public ToolExecutionResult execute(User user, Map<String, Object> parameters) {
        if (!isAuthorized(user)) {
            return ToolExecutionResult.failure(getName(), "Access Denied: Tenants are not authorized to view property financial revenue metrics.");
        }

        LocalDate now = LocalDate.now();
        LocalDate startOfMonth = now.with(TemporalAdjusters.firstDayOfMonth());
        LocalDate endOfMonth = now.with(TemporalAdjusters.lastDayOfMonth());

        BigDecimal monthlyCollected;
        BigDecimal totalOutstanding;

        if (user.getRole() == Role.ROLE_SUPER_ADMIN) {
            monthlyCollected = invoiceRepository.sumAmountPaidAllAndInvoiceDateBetween(startOfMonth, endOfMonth);
            totalOutstanding = invoiceRepository.sumOutstandingDuesAllAndStatusIn(UNPAID_STATUSES);
        } else {
            monthlyCollected = invoiceRepository.sumAmountPaidByOwnerIdAndInvoiceDateBetween(user.getId(), startOfMonth, endOfMonth);
            totalOutstanding = invoiceRepository.sumOutstandingDuesByOwnerIdAndStatusIn(user.getId(), UNPAID_STATUSES);
        }

        if (monthlyCollected == null) monthlyCollected = BigDecimal.ZERO;
        if (totalOutstanding == null) totalOutstanding = BigDecimal.ZERO;

        BigDecimal totalExpected = monthlyCollected.add(totalOutstanding);
        double collectionEfficiency = (totalExpected.compareTo(BigDecimal.ZERO) > 0)
                ? monthlyCollected.divide(totalExpected, 4, RoundingMode.HALF_UP).doubleValue() * 100.0
                : 100.0;

        StringBuilder sb = new StringBuilder();
        sb.append("### 📊 Revenue & Financial Collection Summary\n");
        sb.append("Period: **").append(now.getMonth()).append(" ").append(now.getYear()).append("**\n\n");
        sb.append("- **Collected Revenue This Month:** **₹").append(monthlyCollected.setScale(2, RoundingMode.HALF_UP).toPlainString()).append("**\n");
        sb.append("- **Total Outstanding Dues:** **₹").append(totalOutstanding.setScale(2, RoundingMode.HALF_UP).toPlainString()).append("**\n");
        sb.append("- **Total Billed Value:** ₹").append(totalExpected.setScale(2, RoundingMode.HALF_UP).toPlainString()).append("\n");
        sb.append("- **Collection Efficiency:** **").append(String.format(Locale.US, "%.1f", collectionEfficiency)).append("%**\n");

        Map<String, Object> data = new HashMap<>();
        data.put("monthlyCollected", monthlyCollected);
        data.put("totalOutstanding", totalOutstanding);
        data.put("totalExpected", totalExpected);
        data.put("collectionEfficiency", collectionEfficiency);

        return ToolExecutionResult.builder()
                .toolName(getName())
                .success(true)
                .summaryText(sb.toString())
                .structuredData(data)
                .recordCount(1)
                .build();
    }
}
