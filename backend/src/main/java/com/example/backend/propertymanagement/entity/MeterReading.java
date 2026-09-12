package com.example.backend.propertymanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Entity representing a physical electricity sub-meter reading taken for a room.
 * A meter reading captures the difference between the current and previous reading,
 * computes units consumed, and holds the rate and total billing amount for that room.
 * Individual tenant shares are stored as {@code UtilityShare} records in the finance module.
 */
@Entity
@Table(name = "meter_readings", uniqueConstraints = {
    @UniqueConstraint(name = "uk_meter_reading_room_month",
            columnNames = {"room_id", "billing_month"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "room")
@EqualsAndHashCode(exclude = "room")
public class MeterReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    /**
     * The meter reading from the previous billing cycle.
     * Used as the baseline for computing units consumed this month.
     */
    @NotNull
    @Column(name = "previous_reading", nullable = false, precision = 10, scale = 2)
    private BigDecimal previousReading;

    /**
     * The current (latest) meter reading taken on {@code readingDate}.
     */
    @NotNull
    @DecimalMin(value = "0.0", inclusive = false)
    @Column(name = "current_reading", nullable = false, precision = 10, scale = 2)
    private BigDecimal currentReading;

    /**
     * Computed: {@code currentReading - previousReading}.
     */
    @NotNull
    @Column(name = "units_consumed", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitsConsumed;

    /**
     * Per-unit electricity rate in INR (e.g. ₹8.00 / unit).
     */
    @NotNull
    @Column(name = "rate_per_unit", nullable = false, precision = 8, scale = 2)
    private BigDecimal ratePerUnit;

    /**
     * Computed: {@code unitsConsumed * ratePerUnit}. Total room electricity cost for the billing month.
     */
    @NotNull
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    /**
     * Billing month identifier, e.g. "SEP-2026". Unique per room.
     */
    @NotBlank
    @Column(name = "billing_month", nullable = false, length = 20)
    private String billingMonth;

    /**
     * Date on which the physical meter reading was taken.
     */
    @NotNull
    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    /**
     * Optional URL to a photo of the meter reading for audit/dispute purposes.
     */
    @Column(name = "meter_photo_url", length = 512)
    private String meterPhotoUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
