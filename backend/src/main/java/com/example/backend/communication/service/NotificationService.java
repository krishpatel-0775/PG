package com.example.backend.communication.service;

import com.example.backend.communication.dto.response.NotificationResponse;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.usermanagement.entity.User;

import java.util.List;

/**
 * Service orchestrating in-app and email notifications across PGManager lifecycle events.
 */
public interface NotificationService {

    List<NotificationResponse> getMyNotifications(String userEmail);

    long getUnreadCount(String userEmail);

    void markAsRead(Long id, String userEmail);

    void markAllAsRead(String userEmail);

    void deleteNotification(Long id, String userEmail);

    void markSelectedAsRead(List<Long> ids, String userEmail);

    void deleteSelected(List<Long> ids, String userEmail);

    void sendWelcomeNotification(User recipient, String role, String tempPassword);

    void sendInvoiceGeneratedNotification(Invoice invoice);

    void sendRentDueReminderNotification(Invoice invoice, int daysRemaining);

    void sendRentOverdueNotification(Invoice invoice);

    void sendPaymentReceiptNotification(Invoice invoice, Payment payment);
}
