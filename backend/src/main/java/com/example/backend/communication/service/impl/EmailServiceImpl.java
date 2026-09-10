package com.example.backend.communication.service.impl;

import com.example.backend.communication.service.EmailService;
import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Implementation of {@link EmailService} delivering HTML emails via Spring JavaMailSender.
 * Provides resilient fallback logging if SMTP credentials are omitted or live sending is disabled.
 */
@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:notifications@pgmanager.com}")
    private String fromAddress;

    public EmailServiceImpl(ObjectProvider<JavaMailSender> mailSenderProvider) {
        this.mailSenderProvider = mailSenderProvider;
    }

    @Override
    public void sendHtmlEmail(String toEmail, String subject, String htmlContent) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Cannot send email: recipient address is blank. Subject: '{}'", subject);
            return;
        }

        // 1. Check if email sending is enabled in application.properties (app.mail.enabled)
        if (!mailEnabled) {
            log.info("[MAIL SERVICE - DISABLED] 'app.mail.enabled=false'. Email not sent to '{}' (Subject: '{}').",
                    toEmail, subject);
            return;
        }

        // 2. Live SMTP Dispatch
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("[EMAIL WARNING] JavaMailSender bean is not available in ApplicationContext. " +
                    "Logging email to console. To: '{}' | Subject: '{}'", toEmail, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, MimeMessageHelper.MULTIPART_MODE_MIXED_RELATED, StandardCharsets.UTF_8.name());

            helper.setFrom(fromAddress);
            helper.setTo(toEmail.trim());
            helper.setSubject(subject);
            helper.setText(htmlContent, true);

            mailSender.send(message);
            log.info("Successfully dispatched email to '{}' with subject '{}'", toEmail, subject);
        } catch (Exception ex) {
            log.error("Failed to transmit email to '{}' with subject '{}'. Reason: {}",
                    toEmail, subject, ex.getMessage(), ex);
            // Non-blocking: Do not re-throw exception to preserve primary database transactions
        }
    }

    @Override
    public boolean isMailEnabled() {
        return mailEnabled;
    }
}
