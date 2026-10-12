package com.example.backend.ai.client;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Resilient, enterprise-grade HTTP client for Google Gemini API.
 * Features:
 * - Connection and response timeouts
 * - Exponential backoff with jitter on transient failures (429, 503, timeouts)
 * - Circuit breaker to isolate provider outages and trigger fast-failover
 * - Token and latency observability
 * - Security: API keys and sensitive tokens are strictly redacted from logs
 */
@Component
public class GeminiClient {

    private static final Logger logger = LoggerFactory.getLogger(GeminiClient.class);
    private static final Random RANDOM = new Random();

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-3.5-flash}")
    private String geminiModel;

    @Value("${gemini.timeout.seconds:25}")
    private int timeoutSeconds;

    @Value("${gemini.max.retries:2}")
    private int maxRetries;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    // Circuit Breaker State
    private enum CircuitState { CLOSED, OPEN, HALF_OPEN }
    private volatile CircuitState circuitState = CircuitState.CLOSED;
    private final AtomicInteger consecutiveFailures = new AtomicInteger(0);
    private final AtomicLong circuitOpenedTime = new AtomicLong(0);
    private static final int CIRCUIT_FAILURE_THRESHOLD = 5;
    private static final long CIRCUIT_RESET_TIMEOUT_MS = 30_000L; // 30 seconds

    public GeminiClient() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    public boolean isConfigured() {
        return geminiApiKey != null && !geminiApiKey.isBlank() && !geminiApiKey.contains("YOUR_API_KEY");
    }

    /**
     * Executes the Gemini generateContent call with circuit breaking and retries.
     */
    public GeminiResponse generateContent(String systemInstruction, String prompt) throws Exception {
        if (!isConfigured()) {
            throw new IllegalStateException("Gemini API key is not configured.");
        }

        checkCircuitBreaker();

        String endpoint = "https://generativelanguage.googleapis.com/v1beta/models/"
                + geminiModel + ":generateContent?key=" + geminiApiKey;

        // Build prompt payload
        Map<String, Object> textPart = Map.of("text", prompt);
        Map<String, Object> contentMap = Map.of("parts", List.of(textPart));
        Map<String, Object> requestPayload = Map.of("contents", List.of(contentMap));

        String jsonBody = objectMapper.writeValueAsString(requestPayload);

        int attempts = 0;
        Exception lastException = null;

        while (attempts <= maxRetries) {
            attempts++;
            long startTime = System.currentTimeMillis();

            try {
                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .header("Content-Type", "application/json")
                        .timeout(Duration.ofSeconds(timeoutSeconds))
                        .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
                long latency = System.currentTimeMillis() - startTime;

                int statusCode = response.statusCode();

                if (statusCode == 200) {
                    onSuccess();
                    return parseGeminiResponse(response.body(), latency);
                }

                // Check retry eligibility
                boolean isTransient = (statusCode == 429 || statusCode == 503 || statusCode == 500);
                String errorDetails = extractErrorMessage(response.body(), statusCode);

                logger.warn("Gemini API error [HTTP {}] on attempt {}/{}: {}", statusCode, attempts, maxRetries + 1, errorDetails);

                if (!isTransient || attempts > maxRetries) {
                    onFailure();
                    throw new RuntimeException("Gemini API failed with HTTP " + statusCode + ": " + errorDetails);
                }

                applyBackoff(attempts);

            } catch (HttpTimeoutException te) {
                lastException = te;
                logger.warn("Gemini request timed out on attempt {}/{}: {}", attempts, maxRetries + 1, te.getMessage());
                if (attempts > maxRetries) {
                    onFailure();
                    throw new RuntimeException("Gemini request timed out after " + timeoutSeconds + "s");
                }
                applyBackoff(attempts);
            } catch (Exception ex) {
                lastException = ex;
                if (ex.getMessage() != null && ex.getMessage().contains("HTTP ")) {
                    throw ex; // Don't wrap our own HTTP exceptions
                }
                logger.warn("Network error contacting Gemini on attempt {}/{}: {}", attempts, maxRetries + 1, ex.getMessage());
                if (attempts > maxRetries) {
                    onFailure();
                    throw ex;
                }
                applyBackoff(attempts);
            }
        }

        onFailure();
        throw (lastException != null) ? lastException : new RuntimeException("Gemini call failed after retries");
    }

    private GeminiResponse parseGeminiResponse(String responseBody, long latency) throws Exception {
        JsonNode root = objectMapper.readTree(responseBody);
        JsonNode candidates = root.path("candidates");

        if (!candidates.isArray() || candidates.isEmpty()) {
            throw new RuntimeException("Gemini returned empty candidate response.");
        }

        JsonNode parts = candidates.get(0).path("content").path("parts");
        if (!parts.isArray() || parts.isEmpty()) {
            throw new RuntimeException("Gemini returned candidate without parts.");
        }

        String text = parts.get(0).path("text").asText("");

        // Parse token usage metadata
        int promptTokens = root.path("usageMetadata").path("promptTokenCount").asInt(0);
        int candidateTokens = root.path("usageMetadata").path("candidatesTokenCount").asInt(0);
        int totalTokens = root.path("usageMetadata").path("totalTokenCount").asInt(0);

        logger.info("Gemini call completed: model={}, latency={}ms, totalTokens={}", geminiModel, latency, totalTokens);

        return GeminiResponse.builder()
                .text(text)
                .promptTokens(promptTokens)
                .candidateTokens(candidateTokens)
                .totalTokens(totalTokens)
                .latencyMs(latency)
                .model(geminiModel)
                .build();
    }

    private String extractErrorMessage(String body, int statusCode) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (root.has("error") && root.get("error").has("message")) {
                return root.get("error").get("message").asText();
            }
        } catch (Exception ignored) {
        }
        return "HTTP Status " + statusCode;
    }

    private void applyBackoff(int attempt) {
        try {
            long baseDelay = (long) Math.pow(2, attempt) * 400L;
            long jitter = RANDOM.nextInt(250);
            long totalDelay = Math.min(baseDelay + jitter, 4000L);
            logger.debug("Backing off for {}ms before retry attempt {}", totalDelay, attempt + 1);
            Thread.sleep(totalDelay);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    private synchronized void checkCircuitBreaker() {
        long now = System.currentTimeMillis();
        if (circuitState == CircuitState.OPEN) {
            if (now - circuitOpenedTime.get() > CIRCUIT_RESET_TIMEOUT_MS) {
                circuitState = CircuitState.HALF_OPEN;
                logger.info("Gemini Circuit Breaker entered HALF_OPEN state; probing upstream service.");
            } else {
                throw new IllegalStateException("Gemini Circuit Breaker is OPEN due to repeated failures. Fast-failing to database fallback.");
            }
        }
    }

    private synchronized void onSuccess() {
        consecutiveFailures.set(0);
        if (circuitState != CircuitState.CLOSED) {
            circuitState = CircuitState.CLOSED;
            logger.info("Gemini Circuit Breaker reset to CLOSED.");
        }
    }

    private synchronized void onFailure() {
        int failures = consecutiveFailures.incrementAndGet();
        if (failures >= CIRCUIT_FAILURE_THRESHOLD && circuitState == CircuitState.CLOSED) {
            circuitState = CircuitState.OPEN;
            circuitOpenedTime.set(System.currentTimeMillis());
            logger.error("Gemini Circuit Breaker tripped OPEN after {} consecutive failures.", failures);
        }
    }
}
