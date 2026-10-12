package com.example.backend.ai.client;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Encapsulates the verified output from Google Gemini API execution.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GeminiResponse {

    private String text;
    private int promptTokens;
    private int candidateTokens;
    private int totalTokens;
    private long latencyMs;
    private String model;
}
