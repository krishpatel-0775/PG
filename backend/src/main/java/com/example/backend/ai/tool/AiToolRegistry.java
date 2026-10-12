package com.example.backend.ai.tool;

import com.example.backend.usermanagement.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Enterprise tool registry that discovers and registers all approved domain tools.
 * Enforces explicit allowlisting, argument validation, and role authorization.
 */
@Component
public class AiToolRegistry {

    private static final Logger logger = LoggerFactory.getLogger(AiToolRegistry.class);
    private final Map<String, AiTool> toolMap = new ConcurrentHashMap<>();

    public AiToolRegistry(List<AiTool> tools) {
        if (tools != null) {
            for (AiTool tool : tools) {
                toolMap.put(tool.getName(), tool);
                logger.info("Registered AI Domain Tool: [{}] - {}", tool.getName(), tool.getDescription());
            }
        }
    }

    /**
     * Retrieves all tools available to the given user based on their role and permissions.
     */
    public List<AiTool> getAvailableToolsForUser(User user) {
        List<AiTool> available = new ArrayList<>();
        for (AiTool tool : toolMap.values()) {
            if (tool.isAuthorized(user)) {
                available.add(tool);
            }
        }
        return available;
    }

    /**
     * Looks up an approved tool by name.
     */
    public Optional<AiTool> getTool(String name) {
        if (name == null) return Optional.empty();
        return Optional.ofNullable(toolMap.get(name));
    }

    /**
     * Executes an approved tool after independently revalidating user permissions.
     */
    public ToolExecutionResult executeTool(String toolName, User user, Map<String, Object> parameters) {
        Optional<AiTool> opt = getTool(toolName);
        if (opt.isEmpty()) {
            logger.warn("Attempted to execute unapproved tool [{}] by user [{}]", toolName, user.getEmail());
            return ToolExecutionResult.failure(toolName, "Unapproved tool or operation: " + toolName);
        }

        AiTool tool = opt.get();
        if (!tool.isAuthorized(user)) {
            logger.warn("Authorization rejected for tool [{}] by user [{}] (role: {})", toolName, user.getEmail(), user.getRole());
            return ToolExecutionResult.failure(toolName, "Access denied: Unauthorized to execute " + toolName);
        }

        try {
            logger.debug("Executing tool [{}] for user [{}]", toolName, user.getEmail());
            return tool.execute(user, parameters != null ? parameters : Collections.emptyMap());
        } catch (Exception ex) {
            logger.error("Error during execution of tool [{}]: {}", toolName, ex.getMessage(), ex);
            return ToolExecutionResult.failure(toolName, "Internal tool error: " + ex.getMessage());
        }
    }
}
