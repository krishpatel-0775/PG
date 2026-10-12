package com.example.backend.ai.controller;

import com.example.backend.ai.dto.request.AiChatRequest;
import com.example.backend.ai.dto.response.AiChatResponse;
import com.example.backend.ai.service.AiChatService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Enterprise REST Controller for the PGManager AI Copilot.
 * Integrates real-time PostgreSQL database insights, rate limiting, and Gemini AI.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    private static final Logger logger = LoggerFactory.getLogger(AiChatController.class);
    private final AiChatService aiChatService;

    public AiChatController(AiChatService aiChatService) {
        this.aiChatService = aiChatService;
    }

    /**
     * POST /api/ai/chat
     * Queries the AI assistant with role-based real-time database context.
     *
     * @param request Validated chat request payload (max 1000 characters)
     * @return Formatted AI response with latency and tool metadata
     */
    @PostMapping("/chat")
    public ResponseEntity<AiChatResponse> chat(@Valid @RequestBody AiChatRequest request) {
        String userEmail = resolveAuthenticatedEmail();
        logger.debug("Received AI Copilot request from user [{}]", userEmail);

        AiChatResponse response = aiChatService.processChat(request, userEmail);
        return ResponseEntity.ok(response);
    }

    /**
     * DELETE /api/ai/conversations/{conversationId}
     * Clears conversational history for the given session.
     *
     * @param conversationId Unique session identifier
     * @return Success status map
     */
    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<Map<String, Object>> clearConversation(@PathVariable String conversationId) {
        String userEmail = resolveAuthenticatedEmail();
        boolean cleared = aiChatService.clearConversation(conversationId, userEmail);
        return ResponseEntity.ok(Map.of("success", cleared, "conversationId", conversationId));
    }

    private String resolveAuthenticatedEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName()
                : null;
    }
}
