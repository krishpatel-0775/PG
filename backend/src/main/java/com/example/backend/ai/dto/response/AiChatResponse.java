package com.example.backend.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Enterprise response payload returned by the AI Copilot.
 * Contains the synthesized response, execution metadata, and conversational follow-ups.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatResponse {

    private String reply;
    private String source; // "GEMINI_AI", "DATABASE_DIRECT", "RATE_LIMITED", "ERROR"
    private String conversationId;
    private LocalDateTime timestamp;
    private List<String> suggestedActions;
    private Long latencyMs;
    private String toolInvoked;
}
