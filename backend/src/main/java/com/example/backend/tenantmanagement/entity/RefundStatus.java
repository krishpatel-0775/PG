package com.example.backend.tenantmanagement.entity;

/**
 * Enumeration representing the refund/settlement outcome for a {@link CheckoutClearance}.
 * <ul>
 *   <li>{@code PENDING} — Settlement calculated but refund not yet disbursed.</li>
 *   <li>{@code REFUNDED} — Net positive refund disbursed to tenant via agreed payment method.</li>
 *   <li>{@code SETTLED_RETAINED} — Deposit fully consumed by dues and damages; zero net refund.</li>
 *   <li>{@code DEFICIT_OWED} — Deductions exceed deposit; tenant owes additional amount to PG owner.</li>
 * </ul>
 */
public enum RefundStatus {
    PENDING,
    REFUNDED,
    SETTLED_RETAINED,
    DEFICIT_OWED
}
