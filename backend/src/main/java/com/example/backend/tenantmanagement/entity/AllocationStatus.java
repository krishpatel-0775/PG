package com.example.backend.tenantmanagement.entity;

/**
 * Enumeration representing the status of a tenant's bed allocation.
 * <ul>
 *   <li>{@code ACTIVE} — Tenant is currently residing in the bed.</li>
 *   <li>{@code NOTICE_SERVED} — Tenant has served a move-out notice; rent may be offset against security deposit.</li>
 *   <li>{@code VACATED} — Tenant has physically vacated after final checkout clearance settlement.</li>
 *   <li>{@code COMPLETED} — Legacy status; kept for backward compatibility with earlier checkout flow.</li>
 * </ul>
 */
public enum AllocationStatus {
    ACTIVE,
    NOTICE_SERVED,
    VACATED,
    COMPLETED
}
