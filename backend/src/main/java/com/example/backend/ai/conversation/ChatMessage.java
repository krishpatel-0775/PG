package com.example.backend.ai.conversation;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * An individual conversational turn stored in session memory.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChatMessage {

    private String role; // "user" or "model"
    private String content;
    private LocalDateTime timestamp;
}
