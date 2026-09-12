package com.example.backend.financemanagement.entity;

import com.example.backend.propertymanagement.entity.MeterReading;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.usermanagement.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entity representing a single tenant's prorated electricity share for a given meter reading cycle.
 *
 * <p>Proration formula:
 * <ul>
 *   <li>Base share per bed = {@code meterReading.totalAmount / room.totalCapacity}</li>
 *   <li>If tenant occupied full month: {@code shareAmount = baseShare}</li>
 *   <li>If partial month: {@code shareAmount = (baseShare / totalDaysInMonth) * daysOccupied}</li>
 * </ul>
 */
@Entity
@Table(name = "utility_shares", uniqueConstraints = {
    @UniqueConstraint(name = "uk_utility_share_reading_allocation",
            columnNames = {"meter_reading_id", "allocation_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"meterReading", "allocation", "tenant", "invoice"})
@EqualsAndHashCode(exclude = {"meterReading", "allocation", "tenant", "invoice"})
public class UtilityShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meter_reading_id", nullable = false)
    private MeterReading meterReading;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id", nullable = false)
    private Allocation allocation;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    /**
     * Number of days the tenant occupied the bed within the billing month.
     * Capped at month boundaries: {@code min(billingMonthEnd, checkoutDate) - max(billingMonthStart, checkInDate) + 1}.
     */
    @NotNull
    @Column(name = "days_occupied", nullable = false)
    private Integer daysOccupied;

    /**
     * Total calendar days in the billing month (28, 29, 30, or 31).
     */
    @NotNull
    @Column(name = "total_days_in_month", nullable = false)
    private Integer totalDaysInMonth;

    /**
     * Prorated share amount in INR charged to this tenant for the billing month.
     */
    @NotNull
    @Column(name = "share_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal shareAmount;

    /**
     * The utility invoice generated for this tenant share. Null until committed.
     */
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", unique = true)
    private Invoice invoice;

    /**
     * Lifecycle status of this utility share record.
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UtilityShareStatus status = UtilityShareStatus.CALCULATED;
}
