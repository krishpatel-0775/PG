package com.example.backend.ai.service;

import com.example.backend.ai.dto.request.AiChatRequest;
import com.example.backend.ai.dto.response.AiChatResponse;

/**
 * Service interface for AI Copilot orchestration with live database grounding and Gemini integration.
 */
public interface AiChatService {

    /**
     * Processes an incoming chat message, extracts relevant real-time PG system
     * database context via authorized tools, and synthesizes answers through Gemini.
     *
     * @param request The chat request containing user prompt and conversationId
     * @param userEmail The authenticated user's email address
     * @return Formatted AI response with database-backed insights
     */
    AiChatResponse processChat(AiChatRequest request, String userEmail);

    /**
     * Clears conversational history for the given session.
     *
     * @param conversationId Unique session identifier
     * @param userEmail Authenticated user email
     * @return true if cleared successfully
     */
    boolean clearConversation(String conversationId, String userEmail);
}
