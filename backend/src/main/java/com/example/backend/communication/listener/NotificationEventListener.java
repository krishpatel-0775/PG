package com.example.backend.communication.listener;

import com.example.backend.communication.dto.response.NotificationResponse;
import com.example.backend.communication.entity.Notification;
import com.example.backend.communication.event.NotificationEvent;
import com.example.backend.communication.repository.NotificationRepository;
import com.example.backend.communication.service.EmailService;
import com.example.backend.communication.service.NotificationSseService;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Asynchronous event listener consuming {@link NotificationEvent} instances.
 * Uses @TransactionalEventListener with AFTER_COMMIT to guarantee that referenced entities
 * (Users, Invoices, Payments) are fully committed to PostgreSQL before in-app notifications
 * and emails are dispatched.
 */
@Component
@Slf4j
public class NotificationEventListener {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final NotificationSseService notificationSseService;

    public NotificationEventListener(NotificationRepository notificationRepository,
                                     UserRepository userRepository,
                                     EmailService emailService,
                                     NotificationSseService notificationSseService) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.notificationSseService = notificationSseService;
    }

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handleNotificationEvent(NotificationEvent event) {
        if (event == null || event.getRecipient() == null) {
            log.warn("Discarding invalid NotificationEvent: event or recipient is null.");
            return;
        }

        User managedRecipient = null;
        try {
            // Re-fetch recipient in the current transaction session to guarantee persistence
            if (event.getRecipient().getId() != null) {
                managedRecipient = userRepository.findById(event.getRecipient().getId()).orElse(null);
            }
            if (managedRecipient == null && event.getRecipient().getEmail() != null) {
                managedRecipient = userRepository.findByEmail(event.getRecipient().getEmail().trim().toLowerCase()).orElse(null);
            }

            if (managedRecipient != null) {
                // 1. Persist In-App Notification Entity
                Notification notification = Notification.builder()
                        .recipient(managedRecipient)
                        .title(event.getTitle())
                        .message(event.getMessage())
                        .type(event.getType())
                        .actionUrl(event.getActionUrl())
                        .isRead(false)
                        .build();

                notificationRepository.save(notification);
                log.info("Persisted in-app notification ID {} for user {} ({})",
                        notification.getId(), managedRecipient.getId(), managedRecipient.getEmail());

                // 2. Broadcast Real-time Server-Sent Event (SSE) to active browser clients
                notificationSseService.broadcastNotification(
                        managedRecipient.getEmail(),
                        NotificationResponse.fromEntity(notification)
                );
            } else {
                log.warn("Recipient user not found in database (ID: {}, Email: {}). Skipping in-app notification persistence.",
                        event.getRecipient().getId(), event.getRecipient().getEmail());
            }
        } catch (Exception ex) {
            log.error("Failed to persist in-app notification for recipient {}: {}",
                    event.getRecipient().getEmail(), ex.getMessage(), ex);
        }

        // 2. Dispatch Email if requested (runs even if DB persistence had a warning)
        try {
            if (event.isSendEmail() && event.getEmailHtml() != null && !event.getEmailHtml().isBlank()) {
                String toEmail = managedRecipient != null ? managedRecipient.getEmail() : event.getRecipient().getEmail();
                String subject = event.getEmailSubject() != null ? event.getEmailSubject() : event.getTitle();
                emailService.sendHtmlEmail(toEmail, subject, event.getEmailHtml());
            }
        } catch (Exception ex) {
            log.error("Failed to send email to {}: {}", event.getRecipient().getEmail(), ex.getMessage(), ex);
        }
    }
}
