package com.example.backend.ai.tool;

import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.stereotype.Component;

import java.util.*;

/**
 * Intelligent intent router mapping natural language user queries to approved backend tools.
 * Handles role-awareness, multi-term keyword heuristics, and follow-up context.
 */
@Component
public class IntentRouter {

    public List<String> resolveToolIntents(String userMessage, User user) {
        if (userMessage == null || userMessage.isBlank()) {
            return Collections.emptyList();
        }

        String lower = userMessage.toLowerCase().trim();
        List<String> selectedTools = new ArrayList<>();
        Role role = user.getRole();
        boolean isOwnerOrAdmin = (role == Role.ROLE_SUPER_ADMIN || role == Role.ROLE_PG_OWNER || role == Role.ROLE_STAFF);

        // 1. Pending fees & Invoices
        if (matchesAny(lower, "fee", "fees", "due", "dues", "unpaid", "pending", "defaulter", "defaulters",
                "not paid", "haven't paid", "hasn't paid", "not paying", "who owes", "balance", "overdue", "invoice")) {
            selectedTools.add("getPendingInvoices");
        }

        // 2. Vacancies & Occupancy
        if (matchesAny(lower, "vacan", "occup", "empty bed", "free bed", "available bed", "available room",
                "capacity", "how many beds", "room availability", "space available")) {
            selectedTools.add("getVacantBeds");
        }

        // 3. Maintenance & Complaints
        if (matchesAny(lower, "complaint", "issue", "ticket", "problem", "repair", "maintenance", "broken", "leak", "clean")) {
            selectedTools.add("getOpenComplaints");
        }

        // 4. Revenue & Financial Summary (Only if authorized!)
        if (isOwnerOrAdmin && matchesAny(lower, "revenue", "income", "collection", "profit", "earning", "finance", "financial", "how much money")) {
            selectedTools.add("getRevenueSummary");
        }

        // 5. Tenant Directory / Personal Details
        if (matchesAny(lower, "tenant", "resident", "who lives", "directory", "guest", "my room", "my bed", "assigned bed", "roommate")) {
            // Avoid adding if already handling purely fees
            if (!selectedTools.contains("getTenantOverview")) {
                selectedTools.add("getTenantOverview");
            }
        }

        // 6. Generic Overview Query (e.g. "overview", "status", "summary", "dashboard", "how is my pg")
        if (selectedTools.isEmpty() && matchesAny(lower, "overview", "summary", "status", "how is my pg", "report", "health")) {
            if (isOwnerOrAdmin) {
                selectedTools.add("getPendingInvoices");
                selectedTools.add("getVacantBeds");
                selectedTools.add("getOpenComplaints");
            } else {
                selectedTools.add("getTenantOverview");
                selectedTools.add("getPendingInvoices");
            }
        }

        return selectedTools;
    }

    private boolean matchesAny(String input, String... patterns) {
        for (String pattern : patterns) {
            if (input.contains(pattern)) return true;
        }
        return false;
    }
}
