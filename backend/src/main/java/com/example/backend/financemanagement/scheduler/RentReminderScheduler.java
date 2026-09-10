package com.example.backend.financemanagement.scheduler;

import com.example.backend.communication.service.NotificationService;
import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import com.example.backend.financemanagement.repository.InvoiceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * Daily scheduler checking pending rent invoices to dispatch:
 * 1. 3-Day and 1-Day Pre-Due Date reminders to residents
 * 2. Overdue rent alerts for unsettled invoices past due date
 */
@Component
@Slf4j
public class RentReminderScheduler {

    private final InvoiceRepository invoiceRepository;
    private final NotificationService notificationService;

    public RentReminderScheduler(InvoiceRepository invoiceRepository,
                                 NotificationService notificationService) {
        this.invoiceRepository = invoiceRepository;
        this.notificationService = notificationService;
    }

    /**
     * Executes every day at 9:00 AM.
     */
    @Scheduled(cron = "0 0 9 * * ?")
    @Transactional(readOnly = true)
    public void runDailyRentReminders() {
        log.info("Starting daily rent reminder cron job at 09:00 AM...");
        LocalDate today = LocalDate.now();
        List<InvoiceStatus> pending = List.of(InvoiceStatus.UNPAID, InvoiceStatus.PARTIALLY_PAID);

        // 1. Reminders for invoices due in 3 days
        LocalDate dueIn3Days = today.plusDays(3);
        List<Invoice> in3Days = invoiceRepository.findByStatusInAndDueDate(pending, dueIn3Days);
        for (Invoice inv : in3Days) {
            notificationService.sendRentDueReminderNotification(inv, 3);
        }
        log.info("Dispatched {} pre-due reminders for due date {}", in3Days.size(), dueIn3Days);

        // 2. Reminders for invoices due tomorrow (1 day)
        LocalDate dueTomorrow = today.plusDays(1);
        List<Invoice> in1Day = invoiceRepository.findByStatusInAndDueDate(pending, dueTomorrow);
        for (Invoice inv : in1Day) {
            notificationService.sendRentDueReminderNotification(inv, 1);
        }
        log.info("Dispatched {} pre-due reminders for due date {}", in1Day.size(), dueTomorrow);

        // 3. Alerts for overdue invoices
        List<Invoice> overdue = invoiceRepository.findByStatusInAndDueDateLessThan(pending, today);
        for (Invoice inv : overdue) {
            notificationService.sendRentOverdueNotification(inv);
        }
        log.info("Dispatched {} overdue rent alerts.", overdue.size());
    }
}
