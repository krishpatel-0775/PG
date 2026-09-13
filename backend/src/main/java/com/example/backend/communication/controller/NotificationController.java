package com.example.backend.communication.controller;

import com.example.backend.communication.dto.response.NotificationResponse;
import com.example.backend.communication.service.NotificationService;
import com.example.backend.communication.service.NotificationSseService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;
import java.util.Map;

/**
 * REST Controller exposing endpoints to fetch in-app notifications, stream real-time SSE events, and manage alerts.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notifications")
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationSseService notificationSseService;

    public NotificationController(NotificationService notificationService,
                                  NotificationSseService notificationSseService) {
        this.notificationService = notificationService;
        this.notificationSseService = notificationSseService;
    }

    /**
     * Subscribes the authenticated client to a real-time Server-Sent Events (SSE) notification stream.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter streamNotifications(Authentication authentication) {
        return notificationSseService.subscribe(authentication.getName());
    }

    /**
     * Retrieves the most recent in-app notifications for the authenticated user.
     */
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getMyNotifications(Authentication authentication) {
        List<NotificationResponse> notifications = notificationService.getMyNotifications(authentication.getName());
        return ResponseEntity.ok(notifications);
    }

    /**
     * Retrieves unread notifications count for badge display.
     */
    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(Authentication authentication) {
        long count = notificationService.getUnreadCount(authentication.getName());
        return ResponseEntity.ok(Map.of("unreadCount", count));
    }

    /**
     * Marks a single notification as read.
     */
    @PatchMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id, Authentication authentication) {
        notificationService.markAsRead(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Marks all user notifications as read.
     */
    @PatchMapping("/mark-all-read")
    public ResponseEntity<Void> markAllAsRead(Authentication authentication) {
        notificationService.markAllAsRead(authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes / dismisses a single notification.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id, Authentication authentication) {
        notificationService.deleteNotification(id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Marks selected notifications as read in bulk.
     */
    @PatchMapping("/bulk-read")
    public ResponseEntity<Void> bulkMarkAsRead(@RequestBody List<Long> ids, Authentication authentication) {
        notificationService.markSelectedAsRead(ids, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    /**
     * Deletes / dismisses selected notifications in bulk.
     */
    @DeleteMapping("/bulk")
    public ResponseEntity<Void> bulkDelete(@RequestBody List<Long> ids, Authentication authentication) {
        notificationService.deleteSelected(ids, authentication.getName());
        return ResponseEntity.noContent().build();
    }
}
