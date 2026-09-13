package com.example.backend.communication.service;

import com.example.backend.communication.dto.response.NotificationResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Service managing Server-Sent Events (SSE) connections for real-time notification streaming.
 */
@Service
@Slf4j
public class NotificationSseService {

    // 30 minutes connection timeout (clients auto-reconnect on timeout)
    private static final long SSE_TIMEOUT = 30 * 60 * 1000L;

    // Thread-safe map of userEmail -> active SseEmitter list (supports multiple open tabs)
    private final Map<String, List<SseEmitter>> emitters = new ConcurrentHashMap<>();

    /**
     * Subscribes an authenticated user to real-time notification stream.
     *
     * @param userEmail the email of the subscriber
     * @return initialized SseEmitter
     */
    public SseEmitter subscribe(String userEmail) {
        String normalizedEmail = normalizeEmail(userEmail);
        SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

        emitters.computeIfAbsent(normalizedEmail, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(normalizedEmail, emitter));
        emitter.onTimeout(() -> {
            log.debug("SSE connection timed out for user: {}", normalizedEmail);
            emitter.complete();
            removeEmitter(normalizedEmail, emitter);
        });
        emitter.onError(e -> {
            log.debug("SSE connection error for user: {} ({})", normalizedEmail, e.getMessage());
            emitter.complete();
            removeEmitter(normalizedEmail, emitter);
        });

        // Send initial handshake ping
        try {
            emitter.send(SseEmitter.event()
                    .name("INIT")
                    .data("Connected to real-time notification stream"));
        } catch (IOException e) {
            log.warn("Failed to send initial SSE INIT event to user {}: {}", normalizedEmail, e.getMessage());
            removeEmitter(normalizedEmail, emitter);
        }

        log.info("Registered SSE connection for user: {} (active tabs: {})",
                normalizedEmail, emitters.getOrDefault(normalizedEmail, List.of()).size());
        return emitter;
    }

    /**
     * Pushes a new notification event in real-time to all active emitters of the target user.
     *
     * @param userEmail target user email
     * @param response notification payload
     */
    public void broadcastNotification(String userEmail, NotificationResponse response) {
        if (userEmail == null || response == null) return;
        String normalizedEmail = normalizeEmail(userEmail);
        List<SseEmitter> userEmitters = emitters.get(normalizedEmail);

        if (userEmitters == null || userEmitters.isEmpty()) {
            log.debug("No active SSE connections for user {}", normalizedEmail);
            return;
        }

        log.info("Broadcasting real-time notification [{}] to user {} across {} emitter(s)",
                response.getTitle(), normalizedEmail, userEmitters.size());

        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(response));
            } catch (Exception ex) {
                log.debug("Failed to deliver SSE event to user {}, removing emitter: {}", normalizedEmail, ex.getMessage());
                removeEmitter(normalizedEmail, emitter);
            }
        }
    }

    /**
     * Sends a periodic heartbeat PING every 25 seconds to keep reverse proxies,
     * load balancers, and browser connections alive.
     */
    @Scheduled(fixedRate = 25000)
    public void sendHeartbeat() {
        if (emitters.isEmpty()) return;

        emitters.forEach((email, emitterList) -> {
            for (SseEmitter emitter : emitterList) {
                try {
                    emitter.send(SseEmitter.event()
                            .name("PING")
                            .data("keep-alive"));
                } catch (Exception ex) {
                    removeEmitter(email, emitter);
                }
            }
        });
    }

    private void removeEmitter(String userEmail, SseEmitter emitter) {
        List<SseEmitter> userEmitters = emitters.get(userEmail);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userEmail);
            }
        }
    }

    private String normalizeEmail(String email) {
        return email != null ? email.trim().toLowerCase() : "";
    }
}
