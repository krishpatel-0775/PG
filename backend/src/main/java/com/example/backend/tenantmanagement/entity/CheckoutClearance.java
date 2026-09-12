package com.example.backend.tenantmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing the final checkout clearance and security deposit settlement
 * for a tenant vacating a PG bed.
 *
 * <p>Settlement formula:
 * {@code netRefundAmount = remainingDeposit - unpaidDuesDeducted - damageDeductions}
 * <ul>
 *   <li>Positive → owner refunds that amount to tenant.</li>
 *   <li>Zero → deposit fully consumed.</li>
 *   <li>Negative → tenant owes the shortfall ({@link RefundStatus#DEFICIT_OWED}).</li>
 * </ul>
 */
@Entity
@Table(name = "checkout_clearances")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"allocation", "damageItems"})
@EqualsAndHashCode(exclude = {"allocation", "damageItems"})
public class CheckoutClearance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id", nullable = false, unique = true)
    private Allocation allocation;

    /**
     * Original security deposit collected at move-in.
     */
    @NotNull
    @Column(name = "initial_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal initialDeposit;

    /**
     * Total rent amount auto-paid from deposit during NOTICE_SERVED billing cycles.
     */
    @NotNull
    @Column(name = "deposit_used_for_rent", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal depositUsedForRent = BigDecimal.ZERO;

    /**
     * Remaining deposit at time of final settlement = {@code initialDeposit - depositUsedForRent}.
     */
    @NotNull
    @Column(name = "remaining_deposit", nullable = false, precision = 10, scale = 2)
    private BigDecimal remainingDeposit;

    /**
     * Sum of outstanding unpaid / partially-paid invoice dues deducted from deposit.
     */
    @NotNull
    @Column(name = "unpaid_dues_deducted", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal unpaidDuesDeducted = BigDecimal.ZERO;

    /**
     * Total physical damage charges assessed by the owner.
     */
    @NotNull
    @Column(name = "damage_deductions", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal damageDeductions = BigDecimal.ZERO;

    /**
     * Final net refund = {@code remainingDeposit - unpaidDuesDeducted - damageDeductions}.
     * Negative value means tenant owes money to the owner.
     */
    @NotNull
    @Column(name = "net_refund_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal netRefundAmount;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "refund_status", nullable = false, length = 30)
    @Builder.Default
    private RefundStatus refundStatus = RefundStatus.PENDING;

    /**
     * UPI UTR / bank reference / cheque number for the actual refund transaction.
     */
    @Column(name = "transaction_reference", length = 150)
    private String transactionReference;

    @Column(name = "settlement_date")
    private LocalDate settlementDate;

    @Column(name = "remarks", length = 500)
    private String remarks;

    @OneToMany(mappedBy = "clearance", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DamageItem> damageItems = new ArrayList<>();
}
