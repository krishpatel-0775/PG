package com.example.backend.financemanagement.entity;

/**
 * Enumeration distinguishing invoice types generated in the PG Management system.
 * <ul>
 *   <li>{@code RENT} — Monthly anniversary-date rent invoice.</li>
 *   <li>{@code UTILITY} — Prorated electricity / utility billing invoice.</li>
 * </ul>
 */
public enum InvoiceType {
    RENT,
    UTILITY
}
