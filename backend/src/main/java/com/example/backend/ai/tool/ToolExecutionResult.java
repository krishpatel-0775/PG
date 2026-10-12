package com.example.backend.ai.tool;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Structured output produced by an authorized AI domain tool execution.
 * Decouples database entities from LLM context and prevents PII leakage.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ToolExecutionResult {

    private String toolName;
    private boolean success;
    private String summaryText;
    private Map<String, Object> structuredData;
    private int recordCount;
    private String errorMessage;

    public static ToolExecutionResult empty(String toolName, String summaryText) {
        return ToolExecutionResult.builder()
                .toolName(toolName)
                .success(true)
                .summaryText(summaryText)
                .recordCount(0)
                .build();
    }

    public static ToolExecutionResult failure(String toolName, String errorMessage) {
        return ToolExecutionResult.builder()
                .toolName(toolName)
                .success(false)
                .errorMessage(errorMessage)
                .summaryText("Error executing " + toolName + ": " + errorMessage)
                .recordCount(0)
                .build();
    }
}
