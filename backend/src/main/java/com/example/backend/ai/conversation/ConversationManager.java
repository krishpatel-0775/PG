package com.example.backend.ai.conversation;

import com.example.backend.usermanagement.entity.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe conversation session manager.
 * Isolates user sessions to prevent cross-tenant context leaks, and limits memory overhead.
 */
@Component
public class ConversationManager {

    private static final Logger logger = LoggerFactory.getLogger(ConversationManager.class);
    private static final int MAX_SESSIONS = 500;
    private static final long SESSION_TIMEOUT_MINUTES = 45;

    private final Map<String, ConversationSession> sessionStore = new ConcurrentHashMap<>();

    /**
     * Retrieves or initializes a conversation session strictly owned by the authenticated user.
     *
     * @param conversationId Requested conversation ID (or null/blank for a new session)
     * @param user Authenticated user
     * @return Validated ConversationSession belonging to this user
     */
    public ConversationSession getOrCreateSession(String conversationId, User user) {
        cleanExpiredSessions();

        if (conversationId != null && !conversationId.isBlank()) {
            ConversationSession existing = sessionStore.get(conversationId);
            if (existing != null) {
                // Security verification: Ensure the user actually owns this conversation
                if (Objects.equals(existing.getUserId(), user.getId())) {
                    existing.setLastAccessedAt(LocalDateTime.now());
                    return existing;
                } else {
                    logger.warn("Security Alert: User [{}] attempted to access conversation [{}] owned by user [{}]! Creating isolated session.",
                            user.getEmail(), conversationId, existing.getUserEmail());
                }
            }
        }

        // Create new isolated session
        String newId = UUID.randomUUID().toString();
        ConversationSession session = ConversationSession.builder()
                .conversationId(newId)
                .userId(user.getId())
                .userEmail(user.getEmail())
                .createdAt(LocalDateTime.now())
                .lastAccessedAt(LocalDateTime.now())
                .messages(new ArrayList<>())
                .build();

        // Enforce max capacity
        if (sessionStore.size() >= MAX_SESSIONS) {
            evictOldestSession();
        }

        sessionStore.put(newId, session);
        return session;
    }

    /**
     * Clears a conversation session.
     */
    public boolean clearSession(String conversationId, User user) {
        if (conversationId == null) return false;
        ConversationSession existing = sessionStore.get(conversationId);
        if (existing != null && Objects.equals(existing.getUserId(), user.getId())) {
            sessionStore.remove(conversationId);
            return true;
        }
        return false;
    }

    private void cleanExpiredSessions() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(SESSION_TIMEOUT_MINUTES);
        sessionStore.entrySet().removeIf(entry -> entry.getValue().getLastAccessedAt().isBefore(cutoff));
    }

    private void evictOldestSession() {
        sessionStore.entrySet().stream()
                .min(Comparator.comparing(e -> e.getValue().getLastAccessedAt()))
                .ifPresent(e -> sessionStore.remove(e.getKey()));
    }
}
