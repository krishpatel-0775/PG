package com.example.backend.ai.tool;

import com.example.backend.complaintmanagement.entity.Complaint;
import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import com.example.backend.complaintmanagement.repository.ComplaintRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Tool for tracking open maintenance complaints and tickets.
 * Strictly separates tenant personal tickets from property-level owner tickets.
 */
@Component
public class OpenComplaintsTool implements AiTool {

    private final ComplaintRepository complaintRepository;

    public OpenComplaintsTool(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Override
    public String getName() {
        return "getOpenComplaints";
    }

    @Override
    public String getDescription() {
        return "Retrieves open maintenance complaints, tickets, categories, and resolution progress.";
    }

    @Override
    public boolean isAuthorized(User user) {
        return user != null && user.getRole() != null;
    }

    @Override
    public ToolExecutionResult execute(User user, Map<String, Object> parameters) {
        Role role = user.getRole();
        List<Complaint> complaints;

        if (role == Role.ROLE_SUPER_ADMIN) {
            complaints = complaintRepository.findAll();
        } else if (role == Role.ROLE_PG_OWNER || role == Role.ROLE_STAFF) {
            complaints = complaintRepository.findByPropertyOwnerIdOrderByCreatedAtDesc(user.getId());
        } else if (role == Role.ROLE_TENANT) {
            complaints = complaintRepository.findByTenantIdOrderByCreatedAtDesc(user.getId());
        } else {
            return ToolExecutionResult.failure(getName(), "Unauthorized role: " + role);
        }

        if (complaints == null || complaints.isEmpty()) {
            return ToolExecutionResult.empty(getName(), "Zero complaints on record. Everything is running smoothly!");
        }

        long openCount = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.OPEN).count();
        long inProgressCount = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.IN_PROGRESS).count();
        long resolvedCount = complaints.stream().filter(c -> c.getStatus() == ComplaintStatus.RESOLVED).count();

        StringBuilder summary = new StringBuilder();
        summary.append("### 🛠️ Maintenance & Complaints Status\n");
        summary.append("- **Total Tickets:** ").append(complaints.size()).append("\n");
        summary.append("- **Open / Pending Action:** **").append(openCount).append("**\n");
        summary.append("- **In Progress:** ").append(inProgressCount).append("\n");
        summary.append("- **Resolved:** ").append(resolvedCount).append("\n\n");

        if (openCount == 0 && inProgressCount == 0) {
            summary.append("All reported complaints have been successfully resolved!\n");
        } else {
            summary.append("**Active Tickets:**\n");
            int shown = 0;
            for (Complaint c : complaints) {
                if (c.getStatus() != ComplaintStatus.RESOLVED && shown < 15) {
                    String tenantLabel = (role == Role.ROLE_TENANT) ? "You" : (c.getTenant() != null ? c.getTenant().getName() : "Tenant");
                    String propName = c.getProperty() != null ? c.getProperty().getName() : "Property";
                    String dateStr = c.getCreatedAt() != null ? c.getCreatedAt().toLocalDate().toString() : "N/A";

                    summary.append("- [**").append(c.getStatus()).append("**] ")
                            .append(c.getTitle())
                            .append(" (").append(c.getCategory()).append(")")
                            .append(" | ").append(propName)
                            .append(" | Reported by: ").append(tenantLabel)
                            .append(" on ").append(dateStr)
                            .append("\n");
                    shown++;
                }
            }
        }

        Map<String, Object> data = new HashMap<>();
        data.put("openCount", openCount);
        data.put("inProgressCount", inProgressCount);
        data.put("resolvedCount", resolvedCount);
        data.put("totalCount", complaints.size());

        return ToolExecutionResult.builder()
                .toolName(getName())
                .success(true)
                .summaryText(summary.toString())
                .structuredData(data)
                .recordCount((int) (openCount + inProgressCount))
                .build();
    }
}
