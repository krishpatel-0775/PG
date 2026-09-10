package com.example.backend.communication.service;

import org.springframework.stereotype.Component;

/**
 * Utility class generating responsive, brand-aligned HTML email templates for PGManager.
 */
@Component
public class EmailTemplateHelper {

    private static final String BRAND_COLOR = "#4f46e5";
    private static final String DARK_BG = "#0f172a";

    /**
     * Builds HTML welcome email for newly registered or onboarded tenants / PG owners.
     */
    public String buildWelcomeEmail(String recipientName, String role, String email, String tempPassword, String loginUrl) {
        StringBuilder credentialsHtml = new StringBuilder();
        if (tempPassword != null && !tempPassword.isBlank()) {
            credentialsHtml.append("""
                <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
                    <div style="font-size: 13px; font-weight: 600; color: #475569; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Your Login Credentials</div>
                    <div style="font-size: 14px; color: #1e293b; margin-bottom: 6px;"><strong>Email:</strong> %s</div>
                    <div style="font-size: 14px; color: #1e293b;"><strong>Temporary Password:</strong> <code style="background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 4px; font-family: monospace;">%s</code></div>
                    <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Please update your password after logging in for the first time.</div>
                </div>
            """.formatted(email, tempPassword));
        }

        String content = """
            <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Welcome to PGManager! 👋</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Your account has been successfully created as <strong>%s</strong>. You can now access room details, monthly billing, digital receipts, and submit maintenance tickets directly from the dashboard.
            </p>
            %s
            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                    Log In to Your Portal &rarr;
                </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5;">If you did not request this account, please reach out to your property administrator immediately.</p>
        """.formatted(recipientName, role, credentialsHtml.toString(), loginUrl);

        return wrapInBaseTemplate("Welcome to PGManager", content);
    }

    /**
     * Builds HTML monthly invoice notification email.
     */
    public String buildInvoiceEmail(String tenantName, String invoiceMonth, String propertyName, String roomBed, String dueDate, String amount, String payUrl) {
        String content = """
            <div style="display: inline-block; background-color: #eef2ff; color: #4338ca; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                NEW INVOICE GENERATED
            </div>
            <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Rent Invoice for %s</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Your monthly stay invoice for <strong>%s</strong> is ready. Below is a summary of your billing cycle:
            </p>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 24px 0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <table style="width: 100%%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Property & Room</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">%s (%s)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Billing Period</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 14px; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Due Date</td>
                        <td style="padding: 8px 0; color: #e11d48; font-weight: 600; font-size: 14px; text-align: right;">%s</td>
                    </tr>
                    <tr style="border-top: 1px dashed #cbd5e1;">
                        <td style="padding: 14px 0 0 0; color: #0f172a; font-weight: 700; font-size: 16px;">Total Amount Due</td>
                        <td style="padding: 14px 0 0 0; color: #4f46e5; font-weight: 800; font-size: 20px; text-align: right;">₹%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 13px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                    View Invoice & Pay Online &rarr;
                </a>
            </div>
            <p style="color: #64748b; font-size: 13px; line-height: 1.5; text-align: center;">You can complete payment securely using UPI, NetBanking, Debit/Credit Card, or Cash to owner.</p>
        """.formatted(invoiceMonth, tenantName, invoiceMonth, propertyName, roomBed, invoiceMonth, dueDate, amount, payUrl);

        return wrapInBaseTemplate("New Rent Invoice: " + invoiceMonth, content);
    }

    /**
     * Builds HTML rent due reminder email.
     */
    public String buildDueReminderEmail(String tenantName, String invoiceMonth, String propertyName, String dueDate, String amount, int daysRemaining, String payUrl) {
        String urgencyBadge = daysRemaining <= 1
                ? "<span style='background-color: #ffe4e6; color: #be123c; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 20px;'>DUE TOMORROW</span>"
                : "<span style='background-color: #fef3c7; color: #b45309; font-weight: 600; font-size: 12px; padding: 4px 12px; border-radius: 20px;'>DUE IN " + daysRemaining + " DAYS</span>";

        String content = """
            <div style="margin-bottom: 12px;">%s</div>
            <h2 style="color: #0f172a; margin-top: 0; font-size: 22px; font-weight: 700;">Upcoming Rent Due Date Reminder</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                This is a quick reminder that rent for <strong>%s</strong> at <strong>%s</strong> is due on <strong>%s</strong>.
            </p>

            <div style="background-color: #f8fafc; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
                <div style="font-size: 14px; color: #475569;">Outstanding Amount:</div>
                <div style="font-size: 24px; font-weight: 800; color: #0f172a; margin-top: 4px;">₹%s</div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 15px;">
                    Pay Dues Now &rarr;
                </a>
            </div>
        """.formatted(urgencyBadge, tenantName, invoiceMonth, propertyName, dueDate, amount, payUrl);

        return wrapInBaseTemplate("Rent Due Reminder: " + invoiceMonth, content);
    }

    /**
     * Builds HTML rent overdue notice email.
     */
    public String buildOverdueAlertEmail(String tenantName, String invoiceMonth, String propertyName, String dueDate, String amount, String payUrl) {
        String content = """
            <div style="display: inline-block; background-color: #fee2e2; color: #b91c1c; font-weight: 700; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 12px;">
                ACTION REQUIRED: OVERDUE
            </div>
            <h2 style="color: #991b1b; margin-top: 0; font-size: 22px; font-weight: 700;">Rent Payment Overdue Notice</h2>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hello <strong>%s</strong>,</p>
            <p style="color: #334155; font-size: 15px; line-height: 1.6;">
                Our records show that rent for <strong>%s</strong> was due on <strong>%s</strong> and remains unpaid.
            </p>

            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 18px; margin: 20px 0;">
                <table style="width: 100%%;">
                    <tr>
                        <td style="color: #991b1b; font-size: 14px;">Property:</td>
                        <td style="color: #0f172a; font-weight: 600; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="color: #991b1b; font-size: 14px; padding-top: 8px;">Overdue Amount:</td>
                        <td style="color: #b91c1c; font-weight: 800; font-size: 20px; text-align: right; padding-top: 8px;">₹%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="%s" style="background-color: #dc2626; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 700; text-decoration: none; display: inline-block; font-size: 15px;">
                    Clear Overdue Rent Immediately &rarr;
                </a>
            </div>
        """.formatted(tenantName, invoiceMonth, dueDate, propertyName, amount, payUrl);

        return wrapInBaseTemplate("Urgent: Overdue Rent Notice", content);
    }

    /**
     * Builds HTML digital payment receipt email.
     */
    public String buildPaymentReceiptEmail(String tenantName, String invoiceId, String invoiceMonth, String propertyName, String roomBed, String amountPaid, String paymentMode, String txnId, String date, String portalUrl) {
        String content = """
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 50%%; background-color: #d1fae5; color: #059669; font-size: 24px; font-weight: bold;">
                    &#10003;
                </div>
                <h2 style="color: #065f46; margin: 12px 0 4px 0; font-size: 22px; font-weight: 700;">Payment Confirmed!</h2>
                <div style="color: #64748b; font-size: 13px;">Official Rent Payment Receipt</div>
            </div>

            <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Receipt / Invoice ID</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">#INV-%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Resident Name</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Property & Bed</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">%s (%s)</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Billing Cycle</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Payment Method</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Transaction Reference</td>
                        <td style="padding: 8px 0; color: #0f172a; font-family: monospace; font-size: 13px; text-align: right;">%s</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-size: 13px;">Settled Date</td>
                        <td style="padding: 8px 0; color: #0f172a; font-weight: 600; font-size: 13px; text-align: right;">%s</td>
                    </tr>
                    <tr style="border-top: 1px solid #e2e8f0;">
                        <td style="padding: 14px 0 0 0; color: #0f172a; font-weight: 700; font-size: 15px;">Amount Paid</td>
                        <td style="padding: 14px 0 0 0; color: #059669; font-weight: 800; font-size: 20px; text-align: right;">₹%s</td>
                    </tr>
                </table>
            </div>

            <div style="text-align: center; margin: 26px 0;">
                <a href="%s" style="background-color: #4f46e5; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block; font-size: 14px;">
                    View & Print Full Receipt &rarr;
                </a>
            </div>
            <p style="color: #94a3b8; font-size: 12px; text-align: center;">This is an electronically generated receipt for your records.</p>
        """.formatted(invoiceId, tenantName, propertyName, roomBed, invoiceMonth, paymentMode, txnId != null ? txnId : "N/A", date, amountPaid, portalUrl);

        return wrapInBaseTemplate("Payment Receipt: " + invoiceMonth, content);
    }

    /**
     * Encloses email body within a unified responsive PGManager frame.
     */
    private String wrapInBaseTemplate(String preheader, String bodyContent) {
        return """
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>%s</title>
            </head>
            <body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
                    <tr>
                        <td align="center">
                            <!-- Email Card Container -->
                            <table width="100%%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                                <!-- Header Banner -->
                                <tr>
                                    <td style="background-color: %s; padding: 24px 32px; text-align: left;">
                                        <table width="100%%" border="0" cellspacing="0" cellpadding="0">
                                            <tr>
                                                <td>
                                                    <span style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">PGManager</span>
                                                    <span style="font-size: 11px; font-weight: 600; color: #c7d2fe; margin-left: 8px; text-transform: uppercase; letter-spacing: 1px;">Enterprise Hub</span>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                <!-- Main Body -->
                                <tr>
                                    <td style="padding: 32px;">
                                        %s
                                    </td>
                                </tr>
                                <!-- Footer -->
                                <tr>
                                    <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
                                        <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                                            &copy; 2026 PGManager Property Management System.<br>
                                            All rights reserved. Secure, automated property & resident operations.
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        """.formatted(preheader, BRAND_COLOR, bodyContent);
    }
}
