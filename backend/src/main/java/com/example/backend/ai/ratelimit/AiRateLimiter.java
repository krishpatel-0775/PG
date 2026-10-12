package com.example.backend.ai.ratelimit;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Thread-safe sliding-window rate limiter per user.
 * Protects third-party Gemini API quotas and defends backend from request flooding.
 */
@Component
public class AiRateLimiter {

    @Value("${gemini.ratelimit.requests-per-minute:15}")
    private int maxRequestsPerMinute;

    private final Map<String, Deque<Long>> userRequestTimestamps = new ConcurrentHashMap<>();

    /**
     * Checks if a request by the given user is within rate limits.
     *
     * @param userKey Unique user identifier (e.g. email or userId)
     * @return true if request is allowed, false if rate limit exceeded
     */
    public synchronized boolean tryAcquire(String userKey) {
        long now = Instant.now().toEpochMilli();
        long windowStart = now - 60_000L; // 1-minute window

        Deque<Long> timestamps = userRequestTimestamps.computeIfAbsent(userKey, k -> new ArrayDeque<>());

        // Evict expired timestamps older than 60 seconds
        while (!timestamps.isEmpty() && timestamps.peekFirst() < windowStart) {
            timestamps.pollFirst();
        }

        if (timestamps.size() < maxRequestsPerMinute) {
            timestamps.addLast(now);
            return true;
        }

        return false;
    }

    /**
     * Calculates the estimated wait time in seconds before a user can send their next request.
     */
    public synchronized long getRemainingCooldownSeconds(String userKey) {
        Deque<Long> timestamps = userRequestTimestamps.get(userKey);
        if (timestamps == null || timestamps.isEmpty()) {
            return 0;
        }

        long oldestTimestamp = timestamps.peekFirst();
        long cooldownMs = (oldestTimestamp + 60_000L) - Instant.now().toEpochMilli();
        return Math.max(1, (cooldownMs + 999) / 1000);
    }
}
