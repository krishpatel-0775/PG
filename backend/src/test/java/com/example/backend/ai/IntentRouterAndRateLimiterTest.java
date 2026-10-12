package com.example.backend.ai;

import com.example.backend.ai.ratelimit.AiRateLimiter;
import com.example.backend.ai.tool.IntentRouter;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class IntentRouterAndRateLimiterTest {

    private final IntentRouter intentRouter = new IntentRouter();

    @Test
    @DisplayName("IntentRouter: Correctly routes fee defaulter queries to getPendingInvoices")
    void testFeeIntentRouting() {
        User owner = User.builder().role(Role.ROLE_PG_OWNER).build();
        List<String> tools = intentRouter.resolveToolIntents("Give me list of tenants who have not paid fees", owner);

        assertTrue(tools.contains("getPendingInvoices"));
    }

    @Test
    @DisplayName("IntentRouter: Routes vacant beds queries to getVacantBeds")
    void testVacantBedsRouting() {
        User owner = User.builder().role(Role.ROLE_PG_OWNER).build();
        List<String> tools = intentRouter.resolveToolIntents("How many vacant beds do I have in my PG?", owner);

        assertTrue(tools.contains("getVacantBeds"));
    }

    @Test
    @DisplayName("IntentRouter: Routes complaints queries to getOpenComplaints")
    void testComplaintsRouting() {
        User tenant = User.builder().role(Role.ROLE_TENANT).build();
        List<String> tools = intentRouter.resolveToolIntents("Any update on my maintenance issue?", tenant);

        assertTrue(tools.contains("getOpenComplaints"));
    }

    @Test
    @DisplayName("IntentRouter: Tenant asking for revenue does NOT receive getRevenueSummary")
    void testTenantDoesNotGetRevenueTool() {
        User tenant = User.builder().role(Role.ROLE_TENANT).build();
        List<String> tools = intentRouter.resolveToolIntents("What is our monthly revenue collection?", tenant);

        assertFalse(tools.contains("getRevenueSummary"), "Tenants must never receive the revenue tool intent");
    }

    @Test
    @DisplayName("AiRateLimiter: Enforces sliding window limit and rejects request flooding")
    void testRateLimiterThreshold() {
        AiRateLimiter rateLimiter = new AiRateLimiter();
        ReflectionTestUtils.setField(rateLimiter, "maxRequestsPerMinute", 5);

        String userKey = "test-user@pg.com";

        // First 5 requests must pass
        for (int i = 0; i < 5; i++) {
            assertTrue(rateLimiter.tryAcquire(userKey), "Request " + (i + 1) + " should be allowed");
        }

        // 6th request within same minute must be rejected
        assertFalse(rateLimiter.tryAcquire(userKey), "6th request within window must be rejected");
        assertTrue(rateLimiter.getRemainingCooldownSeconds(userKey) > 0, "Cooldown must be greater than 0");
    }
}
