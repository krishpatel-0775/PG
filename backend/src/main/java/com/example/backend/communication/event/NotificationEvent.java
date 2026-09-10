package com.example.backend.communication.event;

import com.example.backend.communication.entity.NotificationType;
import com.example.backend.usermanagement.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain event dispatched across Spring ApplicationEventPublisher
 * to persist in-app notifications and trigger asynchronous email delivery.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationEvent {

    private User recipient;
    private String title;
    private String message;
    private NotificationType type;
    private String actionUrl;

    @Builder.Default
    private boolean sendEmail = true;
    private String emailSubject;
    private String emailHtml;
}
