package com.example.backend.ai.tool;

import com.example.backend.usermanagement.entity.User;

import java.util.Map;

/**
 * Contract for approved, enterprise-grade AI domain tools.
 * Each tool must independently validate permissions, enforce resource-level
 * scoping, and return sanitized structured data.
 */
public interface AiTool {

    /**
     * Unique identifier of the tool (e.g., "getPendingInvoices").
     */
    String getName();

    /**
     * Human-readable description of what the tool accomplishes.
     */
    String getDescription();

    /**
     * Validates whether the authenticated user has permission to invoke this tool.
     *
     * @param user Authenticated user
     * @return true if authorized, false otherwise
     */
    boolean isAuthorized(User user);

    /**
     * Executes the authorized domain operation with parameter validation.
     *
     * @param user Authenticated user context
     * @param parameters Input parameters extracted from intent/query
     * @return Structured ToolExecutionResult
     */
    ToolExecutionResult execute(User user, Map<String, Object> parameters);
}
