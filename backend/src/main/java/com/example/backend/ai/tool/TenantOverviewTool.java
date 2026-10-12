package com.example.backend.ai.tool;

import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Tool for inspecting active tenants directory for owners or personal room allocation for tenants.
 */
@Component
public class TenantOverviewTool implements AiTool {

    private final AllocationRepository allocationRepository;

    public TenantOverviewTool(AllocationRepository allocationRepository) {
        this.allocationRepository = allocationRepository;
    }

    @Override
    public String getName() {
        return "getTenantOverview";
    }

    @Override
    public String getDescription() {
        return "Retrieves active tenants directory for PG Owners, or room and bed details for Tenants.";
    }

    @Override
    public boolean isAuthorized(User user) {
        return user != null && user.getRole() != null;
    }

    @Override
    public ToolExecutionResult execute(User user, Map<String, Object> parameters) {
        Role role = user.getRole();

        if (role == Role.ROLE_TENANT) {
            Optional<Allocation> allocOpt = allocationRepository.findFirstByTenantIdAndStatus(user.getId(), AllocationStatus.ACTIVE);
            if (allocOpt.isEmpty()) {
                return ToolExecutionResult.empty(getName(), "You currently do not have an active bed allocation.");
            }

            Allocation alloc = allocOpt.get();
            String propName = (alloc.getBed() != null && alloc.getBed().getRoom() != null
                    && alloc.getBed().getRoom().getProperty() != null) ? alloc.getBed().getRoom().getProperty().getName() : "N/A";
            String roomNo = (alloc.getBed() != null && alloc.getBed().getRoom() != null) ? alloc.getBed().getRoom().getRoomNumber() : "N/A";
            String bedNo = alloc.getBed() != null ? alloc.getBed().getBedNumber() : "N/A";

            StringBuilder sb = new StringBuilder();
            sb.append("### 🏠 Your Room & Bed Allocation\n");
            sb.append("- **Property:** ").append(propName).append("\n");
            sb.append("- **Room Number:** ").append(roomNo).append("\n");
            sb.append("- **Bed Assignment:** ").append(bedNo).append("\n");
            sb.append("- **Monthly Rent:** ₹").append(alloc.getMonthlyRent()).append("\n");
            sb.append("- **Security Deposit:** ₹").append(alloc.getDepositAmount()).append("\n");
            sb.append("- **Check-in Date:** ").append(alloc.getCheckInDate()).append("\n");

            Map<String, Object> data = new HashMap<>();
            data.put("property", propName);
            data.put("room", roomNo);
            data.put("bed", bedNo);
            data.put("monthlyRent", alloc.getMonthlyRent());

            return ToolExecutionResult.builder()
                    .toolName(getName())
                    .success(true)
                    .summaryText(sb.toString())
                    .structuredData(data)
                    .recordCount(1)
                    .build();
        }

        // Owner or Admin
        List<Allocation> allocations;
        if (role == Role.ROLE_SUPER_ADMIN) {
            allocations = allocationRepository.findByStatus(AllocationStatus.ACTIVE);
        } else {
            allocations = allocationRepository.findByBedRoomPropertyOwnerIdAndStatus(user.getId(), AllocationStatus.ACTIVE);
        }

        if (allocations == null || allocations.isEmpty()) {
            return ToolExecutionResult.empty(getName(), "No active tenants currently staying across your properties.");
        }

        StringBuilder sb = new StringBuilder();
        sb.append("### 👥 Active Tenants Directory\n");
        sb.append("Total Active Residents: **").append(allocations.size()).append("**\n\n");

        int limit = Math.min(allocations.size(), 25);
        for (int i = 0; i < limit; i++) {
            Allocation a = allocations.get(i);
            String name = a.getTenant() != null ? a.getTenant().getName() : "Tenant";
            String phone = a.getTenant() != null ? maskPhone(a.getTenant().getPhone()) : "N/A";
            String room = (a.getBed() != null && a.getBed().getRoom() != null) ? a.getBed().getRoom().getRoomNumber() : "N/A";
            String bed = a.getBed() != null ? a.getBed().getBedNumber() : "N/A";
            String prop = (a.getBed() != null && a.getBed().getRoom() != null && a.getBed().getRoom().getProperty() != null)
                    ? a.getBed().getRoom().getProperty().getName() : "Property";

            sb.append("- **").append(name).append("** (").append(phone).append(")")
                    .append(" | ").append(prop).append(" (Rm ").append(room).append(", Bed ").append(bed).append(")")
                    .append(" | Rent: ₹").append(a.getMonthlyRent())
                    .append(" | Since: ").append(a.getCheckInDate())
                    .append("\n");
        }

        if (allocations.size() > limit) {
            sb.append("  * ...and ").append(allocations.size() - limit).append(" more active tenants.\n");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("activeTenantCount", allocations.size());

        return ToolExecutionResult.builder()
                .toolName(getName())
                .success(true)
                .summaryText(sb.toString())
                .structuredData(data)
                .recordCount(allocations.size())
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 5) return "N/A";
        int len = phone.length();
        return "******" + phone.substring(len - 4);
    }
}
