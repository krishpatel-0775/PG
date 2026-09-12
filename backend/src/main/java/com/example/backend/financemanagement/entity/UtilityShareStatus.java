package com.example.backend.financemanagement.entity;

/**
 * Enumeration representing the lifecycle status of a {@link UtilityShare} record.
 * <ul>
 *   <li>{@code CALCULATED} — Share computed in-memory during preview; not yet persisted as a billed invoice.</li>
 *   <li>{@code BILLED} — Share has been persisted and an {@link Invoice} of type UTILITY has been created.</li>
 * </ul>
 */
public enum UtilityShareStatus {
    CALCULATED,
    BILLED
}
