package com.example.backend.ai;

import com.example.backend.ai.client.GeminiClient;
import com.example.backend.ai.client.GeminiResponse;
import com.example.backend.ai.conversation.ConversationManager;
import com.example.backend.ai.dto.request.AiChatRequest;
import com.example.backend.ai.dto.response.AiChatResponse;
import com.example.backend.ai.ratelimit.AiRateLimiter;
import com.example.backend.ai.service.impl.AiChatServiceImpl;
import com.example.backend.ai.tool.AiToolRegistry;
import com.example.backend.ai.tool.IntentRouter;
import com.example.backend.ai.tool.ToolExecutionResult;
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

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiChatOrchestratorTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private AiRateLimiter rateLimiter;

    @Mock
    private IntentRouter intentRouter;

    @Mock
    private AiToolRegistry toolRegistry;

    @Mock
    private GeminiClient geminiClient;

    private ConversationManager conversationManager;
    private AiChatServiceImpl aiChatService;

    private User owner;

    @BeforeEach
    void setUp() {
        conversationManager = new ConversationManager();
        aiChatService = new AiChatServiceImpl(
                userRepository,
                rateLimiter,
                conversationManager,
                intentRouter,
                toolRegistry,
                geminiClient
        );

        owner = User.builder()
                .id(1L)
                .name("Property Owner")
                .email("owner@pg.com")
                .role(Role.ROLE_PG_OWNER)
                .build();
    }

    @Test
    @DisplayName("Orchestrator: Generates Gemini response when AI provider is healthy")
    void testSuccessfulGeminiGeneration() throws Exception {
        when(userRepository.findByEmail("owner@pg.com")).thenReturn(Optional.of(owner));
        when(rateLimiter.tryAcquire("owner@pg.com")).thenReturn(true);
        when(intentRouter.resolveToolIntents(anyString(), eq(owner))).thenReturn(List.of("getPendingInvoices"));

        ToolExecutionResult toolResult = ToolExecutionResult.builder()
                .toolName("getPendingInvoices")
                .success(true)
                .summaryText("Found 2 pending invoices totaling ₹10,000.00")
                .build();
        when(toolRegistry.executeTool(eq("getPendingInvoices"), eq(owner), any())).thenReturn(toolResult);

        when(geminiClient.isConfigured()).thenReturn(true);
        when(geminiClient.generateContent(anyString(), anyString())).thenReturn(
                GeminiResponse.builder()
                        .text("Here is your invoice summary: You have 2 pending invoices for ₹10,000.")
                        .totalTokens(85)
                        .latencyMs(350)
                        .build()
        );

        AiChatRequest request = AiChatRequest.builder()
                .message("Who hasn't paid rent?")
                .build();

        AiChatResponse response = aiChatService.processChat(request, "owner@pg.com");

        assertNotNull(response);
        assertEquals("GEMINI_AI", response.getSource());
        assertTrue(response.getReply().contains("Here is your invoice summary"));
        assertNotNull(response.getConversationId());
        assertEquals("getPendingInvoices", response.getToolInvoked());
    }

    @Test
    @DisplayName("Orchestrator: Falls back seamlessly to verified database records when Gemini fails")
    void testGracefulFallbackWhenGeminiThrows() throws Exception {
        when(userRepository.findByEmail("owner@pg.com")).thenReturn(Optional.of(owner));
        when(rateLimiter.tryAcquire("owner@pg.com")).thenReturn(true);
        when(intentRouter.resolveToolIntents(anyString(), eq(owner))).thenReturn(List.of("getVacantBeds"));

        ToolExecutionResult toolResult = ToolExecutionResult.builder()
                .toolName("getVacantBeds")
                .success(true)
                .summaryText("Total Vacant Beds: 5 available across 3 rooms.")
                .build();
        when(toolRegistry.executeTool(eq("getVacantBeds"), eq(owner), any())).thenReturn(toolResult);

        when(geminiClient.isConfigured()).thenReturn(true);
        // Simulate Gemini upstream timeout / 503 failure
        when(geminiClient.generateContent(anyString(), anyString())).thenThrow(new RuntimeException("503 Service Unavailable"));

        AiChatRequest request = AiChatRequest.builder()
                .message("Show vacant beds")
                .build();

        AiChatResponse response = aiChatService.processChat(request, "owner@pg.com");

        assertNotNull(response);
        assertEquals("DATABASE_DIRECT", response.getSource(), "Must declare DATABASE_DIRECT fallback instead of faking AI output");
        assertTrue(response.getReply().contains("Total Vacant Beds: 5 available"));
        assertTrue(response.getReply().contains("Database Fallback Mode"));
    }

    @Test
    @DisplayName("Orchestrator: Enforces rate limiting and rejects excess requests with helpful cooldown")
    void testRateLimitingRejection() {
        when(userRepository.findByEmail("owner@pg.com")).thenReturn(Optional.of(owner));
        when(rateLimiter.tryAcquire("owner@pg.com")).thenReturn(false);
        when(rateLimiter.getRemainingCooldownSeconds("owner@pg.com")).thenReturn(25L);

        AiChatRequest request = AiChatRequest.builder()
                .message("Hello")
                .build();

        AiChatResponse response = aiChatService.processChat(request, "owner@pg.com");

        assertNotNull(response);
        assertEquals("RATE_LIMITED", response.getSource());
        assertTrue(response.getReply().contains("25 seconds"));
        verifyNoInteractions(geminiClient);
    }
}
