package com.example.backend.financemanagement.entity;

/**
 * Enumeration representing supported payment modes in the PG Management system.
 * <ul>
 *   <li>{@code CASH} — Physical cash payment.</li>
 *   <li>{@code UPI} — Unified Payments Interface (UPI) transfer.</li>
 *   <li>{@code ONLINE} — Online gateway / card payment.</li>
 *   <li>{@code BANK_TRANSFER} — NEFT / IMPS / RTGS bank transfer.</li>
 *   <li>{@code SECURITY_DEPOSIT} — Automated offset against the tenant's security deposit during NOTICE_SERVED billing.</li>
 * </ul>
 */
public enum PaymentMode {
    CASH,
    UPI,
    ONLINE,
    BANK_TRANSFER,
    SECURITY_DEPOSIT
}
