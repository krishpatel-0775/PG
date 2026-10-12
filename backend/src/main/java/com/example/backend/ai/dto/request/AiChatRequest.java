package com.example.backend.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Validated request payload for AI Copilot queries.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequest {

    @NotBlank(message = "Message cannot be empty")
    @Size(max = 1000, message = "Message must not exceed 1000 characters")
    private String message;

    @Size(max = 64, message = "Conversation ID must not exceed 64 characters")
    private String conversationId;
}
