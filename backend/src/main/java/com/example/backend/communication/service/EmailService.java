package com.example.backend.communication.service;

/**
 * Service contract for dispatching transactional and template-based emails.
 */
public interface EmailService {

    /**
     * Sends an HTML email to the specified recipient.
     * If SMTP is disabled or unconfigured, it logs the email contents gracefully without throwing an exception.
     *
     * @param toEmail     Recipient address
     * @param subject     Email subject line
     * @param htmlContent Full HTML formatted body
     */
    void sendHtmlEmail(String toEmail, String subject, String htmlContent);

    /**
     * Returns true if live SMTP mail sending is enabled in application configuration.
     */
    boolean isMailEnabled();
}
