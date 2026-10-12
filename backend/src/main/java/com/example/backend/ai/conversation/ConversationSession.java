package com.example.backend.ai.conversation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Encapsulates an active AI conversation session belonging strictly to a specific user.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConversationSession {

    private String conversationId;
    private Long userId;
    private String userEmail;
    private LocalDateTime createdAt;
    private LocalDateTime lastAccessedAt;

    @Builder.Default
    private List<ChatMessage> messages = new ArrayList<>();

    public void addMessage(String role, String text) {
        if (messages.size() >= 8) {
            // Keep sliding window of latest 8 messages
            messages.remove(0);
        }
        messages.add(ChatMessage.builder()
                .role(role)
                .content(text)
                .timestamp(LocalDateTime.now())
                .build());
        this.lastAccessedAt = LocalDateTime.now();
    }
}
