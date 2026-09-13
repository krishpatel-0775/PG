package com.example.backend.tenantmanagement.entity;

/**
 * Strategy chosen by the PG Owner when approving a tenant's move-out notice.
 * <ul>
 *   <li>{@code OFFSET_RENT} — Upcoming notice-period rent invoices will be automatically
 *       paid from the tenant's security deposit balance.</li>
 *   <li>{@code REFUND_AT_CHECKOUT} — Tenant continues paying rent invoices separately;
 *       the deposit remains intact and is settled/refunded on final checkout day after inspection.</li>
 * </ul>
 */
public enum DepositHandlingPolicy {
    OFFSET_RENT,
    REFUND_AT_CHECKOUT
}
