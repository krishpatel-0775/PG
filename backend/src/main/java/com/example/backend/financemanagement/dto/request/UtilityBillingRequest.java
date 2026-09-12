package com.example.backend.financemanagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Request payload for both previewing and committing a utility (electricity) billing cycle for a room.
 */
@Data
public class UtilityBillingRequest {

    /**
     * The room for which the meter reading is being recorded.
     */
    @NotNull(message = "roomId is required")
    private Long roomId;

    /**
     * The current meter reading value (in kWh / units).
     */
    @NotNull(message = "currentReading is required")
    @DecimalMin(value = "0.0", message = "currentReading must be non-negative")
    private BigDecimal currentReading;

    /**
     * Per-unit electricity rate in INR (e.g. 8.00 for ₹8 per unit).
     */
    @NotNull(message = "ratePerUnit is required")
    @DecimalMin(value = "0.01", message = "ratePerUnit must be greater than zero")
    private BigDecimal ratePerUnit;

    /**
     * Billing month identifier in "MMM-YYYY" format (e.g. "SEP-2026").
     * Must match the calendar month being billed.
     */
    @NotBlank(message = "billingMonth is required (e.g. SEP-2026)")
    private String billingMonth;

    /**
     * Optional previous reading override. If not provided, the system fetches the last
     * committed reading for this room from the database.
     */
    private BigDecimal previousReading;
}
