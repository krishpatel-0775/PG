package com.example.backend.communication.service.impl;

import com.example.backend.communication.dto.response.NotificationResponse;
import com.example.backend.communication.entity.Notification;
import com.example.backend.communication.entity.NotificationType;
import com.example.backend.communication.event.NotificationEvent;
import com.example.backend.communication.repository.NotificationRepository;
import com.example.backend.communication.service.EmailTemplateHelper;
import com.example.backend.communication.service.NotificationService;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link NotificationService} creating in-app alerts and broadcasting
 * events to asynchronous notification listeners.
 */
@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final ApplicationEventPublisher eventPublisher;
    private final EmailTemplateHelper emailTemplateHelper;

    @Value("${app.frontend.url:http://localhost:3000}")
    private String frontendUrl;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd MMM yyyy");

    public NotificationServiceImpl(NotificationRepository notificationRepository,
                                   UserRepository userRepository,
                                   ApplicationEventPublisher eventPublisher,
                                   EmailTemplateHelper emailTemplateHelper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.eventPublisher = eventPublisher;
        this.emailTemplateHelper = emailTemplateHelper;
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.findTop30ByRecipientIdOrderByCreatedAtDesc(user.getId())
                .stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(String userEmail) {
        User user = getUserByEmail(userEmail);
        return notificationRepository.countByRecipientIdAndIsReadFalse(user.getId());
    }

    @Override
    @Transactional
    public void markAsRead(Long id, String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAsReadByIdAndRecipientId(id, user.getId());
    }

    @Override
    @Transactional
    public void markAllAsRead(String userEmail) {
        User user = getUserByEmail(userEmail);
        notificationRepository.markAllAsReadByRecipientId(user.getId());
    }

    @Override
    public void sendWelcomeNotification(User recipient, String role, String tempPassword) {
        if (recipient == null) return;
        try {
            String loginUrl = frontendUrl + "/login";
            String emailHtml = emailTemplateHelper.buildWelcomeEmail(
                    recipient.getName(),
                    role,
                    recipient.getEmail(),
                    tempPassword,
                    loginUrl
            );

            NotificationEvent event = NotificationEvent.builder()
                    .recipient(recipient)
                    .title("Welcome to PGManager!")
                    .message("Your account has been registered successfully. Explore your dashboard to get started.")
                    .type(NotificationType.WELCOME)
                    .actionUrl("/dashboard")
                    .sendEmail(true)
                    .emailSubject("Welcome to PGManager - Account Created")
                    .emailHtml(emailHtml)
                    .build();

            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error("Failed to publish welcome notification for {}: {}", recipient.getEmail(), ex.getMessage());
        }
    }

    @Override
    public void sendInvoiceGeneratedNotification(Invoice invoice) {
        if (invoice == null || invoice.getAllocation() == null) return;
        try {
            Allocation allocation = invoice.getAllocation();
            User tenant = allocation.getTenant();
            Property property = allocation.getBed().getRoom().getProperty();

            String propertyName = property != null ? property.getName() : "PG Residence";
            String roomBed = "Room " + allocation.getBed().getRoom().getRoomNumber() + ", Bed " + allocation.getBed().getBedNumber();
            String dueDateStr = invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FORMATTER) : "N/A";
            String amountStr = invoice.getTotalAmount() != null ? invoice.getTotalAmount().toPlainString() : "0";
            String month = invoice.getInvoiceMonth() != null ? invoice.getInvoiceMonth() : "Current Month";
            String payUrl = frontendUrl + "/dashboard/my-dues";

            String emailHtml = emailTemplateHelper.buildInvoiceEmail(
                    tenant.getName(),
                    month,
                    propertyName,
                    roomBed,
                    dueDateStr,
                    amountStr,
                    payUrl
            );

            NotificationEvent event = NotificationEvent.builder()
                    .recipient(tenant)
                    .title("New Rent Invoice Generated: " + month)
                    .message("Your monthly stay invoice of ₹" + amountStr + " for " + month + " is ready. Due by " + dueDateStr + ".")
                    .type(NotificationType.INVOICE_GENERATED)
                    .actionUrl("/dashboard/my-dues")
                    .sendEmail(true)
                    .emailSubject("New Rent Invoice: " + month + " (₹" + amountStr + ")")
                    .emailHtml(emailHtml)
                    .build();

            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error("Failed to publish invoice notification for invoice ID {}: {}", invoice.getId(), ex.getMessage());
        }
    }

    @Override
    public void sendRentDueReminderNotification(Invoice invoice, int daysRemaining) {
        if (invoice == null || invoice.getAllocation() == null) return;
        try {
            Allocation allocation = invoice.getAllocation();
            User tenant = allocation.getTenant();
            Property property = allocation.getBed().getRoom().getProperty();

            String propertyName = property != null ? property.getName() : "PG Residence";
            String dueDateStr = invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FORMATTER) : "N/A";
            BigDecimal due = invoice.getTotalAmount().subtract(invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO);
            String amountStr = due.toPlainString();
            String month = invoice.getInvoiceMonth() != null ? invoice.getInvoiceMonth() : "Monthly Rent";
            String payUrl = frontendUrl + "/dashboard/my-dues";

            String emailHtml = emailTemplateHelper.buildDueReminderEmail(
                    tenant.getName(),
                    month,
                    propertyName,
                    dueDateStr,
                    amountStr,
                    daysRemaining,
                    payUrl
            );

            NotificationEvent event = NotificationEvent.builder()
                    .recipient(tenant)
                    .title("Rent Due in " + daysRemaining + " Days: ₹" + amountStr)
                    .message("Reminder: Rent for " + month + " is due on " + dueDateStr + ". Please complete payment to avoid late fees.")
                    .type(NotificationType.RENT_DUE_REMINDER)
                    .actionUrl("/dashboard/my-dues")
                    .sendEmail(true)
                    .emailSubject("Reminder: Rent Due in " + daysRemaining + " Days (" + month + ")")
                    .emailHtml(emailHtml)
                    .build();

            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error("Failed to publish rent due reminder for invoice ID {}: {}", invoice.getId(), ex.getMessage());
        }
    }

    @Override
    public void sendRentOverdueNotification(Invoice invoice) {
        if (invoice == null || invoice.getAllocation() == null) return;
        try {
            Allocation allocation = invoice.getAllocation();
            User tenant = allocation.getTenant();
            Property property = allocation.getBed().getRoom().getProperty();

            String propertyName = property != null ? property.getName() : "PG Residence";
            String dueDateStr = invoice.getDueDate() != null ? invoice.getDueDate().format(DATE_FORMATTER) : "N/A";
            BigDecimal due = invoice.getTotalAmount().subtract(invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO);
            String amountStr = due.toPlainString();
            String month = invoice.getInvoiceMonth() != null ? invoice.getInvoiceMonth() : "Rent";
            String payUrl = frontendUrl + "/dashboard/my-dues";

            String emailHtml = emailTemplateHelper.buildOverdueAlertEmail(
                    tenant.getName(),
                    month,
                    propertyName,
                    dueDateStr,
                    amountStr,
                    payUrl
            );

            NotificationEvent event = NotificationEvent.builder()
                    .recipient(tenant)
                    .title("URGENT: Rent Payment Overdue (" + month + ")")
                    .message("Your rent payment of ₹" + amountStr + " for " + month + " was due on " + dueDateStr + " and is now overdue.")
                    .type(NotificationType.RENT_OVERDUE)
                    .actionUrl("/dashboard/my-dues")
                    .sendEmail(true)
                    .emailSubject("Urgent: Overdue Rent Notice for " + month)
                    .emailHtml(emailHtml)
                    .build();

            eventPublisher.publishEvent(event);
        } catch (Exception ex) {
            log.error("Failed to publish overdue notification for invoice ID {}: {}", invoice.getId(), ex.getMessage());
        }
    }

    @Override
    public void sendPaymentReceiptNotification(Invoice invoice, Payment payment) {
        if (invoice == null || invoice.getAllocation() == null || payment == null) return;
        try {
            Allocation allocation = invoice.getAllocation();
            User tenant = allocation.getTenant();
            Property property = allocation.getBed().getRoom().getProperty();

            String propertyName = property != null ? property.getName() : "PG Residence";
            String roomBed = "Room " + allocation.getBed().getRoom().getRoomNumber() + ", Bed " + allocation.getBed().getBedNumber();
            String month = invoice.getInvoiceMonth() != null ? invoice.getInvoiceMonth() : "Stay Charges";
            String amountPaidStr = payment.getAmount() != null ? payment.getAmount().toPlainString() : "0";
            String paymentMode = payment.getMode() != null ? payment.getMode().name() : "ONLINE";
            String txnId = payment.getTransactionId() != null ? payment.getTransactionId() : payment.getReferenceId();
            String paymentDateStr = payment.getPaymentDate() != null ? payment.getPaymentDate().format(DATE_FORMATTER) : "N/A";
            String portalUrl = frontendUrl + "/dashboard/my-dues";

            String emailHtml = emailTemplateHelper.buildPaymentReceiptEmail(
                    tenant.getName(),
                    String.valueOf(invoice.getId()),
                    month,
                    propertyName,
                    roomBed,
                    amountPaidStr,
                    paymentMode,
                    txnId,
                    paymentDateStr,
                    portalUrl
            );

            // 1. Notify Resident
            NotificationEvent tenantEvent = NotificationEvent.builder()
                    .recipient(tenant)
                    .title("Payment Received: ₹" + amountPaidStr)
                    .message("Payment of ₹" + amountPaidStr + " for " + month + " has been authorized successfully. Txn Ref: " + (txnId != null ? txnId : "Settled") + ".")
                    .type(NotificationType.PAYMENT_RECEIPT)
                    .actionUrl("/dashboard/my-dues")
                    .sendEmail(true)
                    .emailSubject("Payment Receipt: " + month + " (₹" + amountPaidStr + ")")
                    .emailHtml(emailHtml)
                    .build();

            eventPublisher.publishEvent(tenantEvent);

            // 2. Also notify Property Owner (In-App)
            if (property != null && property.getOwner() != null) {
                User owner = property.getOwner();
                NotificationEvent ownerEvent = NotificationEvent.builder()
                        .recipient(owner)
                        .title("Rent Collected: ₹" + amountPaidStr)
                        .message(tenant.getName() + " paid ₹" + amountPaidStr + " for " + propertyName + " (" + roomBed + "). Mode: " + paymentMode + ".")
                        .type(NotificationType.PAYMENT_RECEIPT)
                        .actionUrl("/dashboard/rent")
                        .sendEmail(false) // In-app notification for owner
                        .build();

                eventPublisher.publishEvent(ownerEvent);
            }
        } catch (Exception ex) {
            log.error("Failed to publish payment receipt notification for invoice ID {}: {}", invoice.getId(), ex.getMessage());
        }
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + email));
    }
}
