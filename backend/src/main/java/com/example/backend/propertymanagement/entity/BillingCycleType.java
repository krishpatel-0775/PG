package com.example.backend.propertymanagement.entity;

/**
 * Enumeration representing the property-level billing cycle preference for tenants.
 * <ul>
 *   <li>{@code ANNIVERSARY} — Tenants are billed monthly on the anniversary of their check-in date.</li>
 *   <li>{@code FIRST_OF_MONTH} — Tenants are billed on the 1st of each calendar month.
 *       New check-ins receive an immediate prorated invoice for the remainder of their first month.</li>
 * </ul>
 */
public enum BillingCycleType {
    ANNIVERSARY,
    FIRST_OF_MONTH
}
