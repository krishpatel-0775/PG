package com.example.backend.tenantmanagement.entity;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.usermanagement.entity.User;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity representing an active or completed bed allocation for a tenant in a PG.
 */
@Entity
@Table(name = "allocations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"tenant", "bed"})
@EqualsAndHashCode(exclude = {"tenant", "bed"})
public class Allocation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", nullable = false)
    private User tenant;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bed_id", nullable = false)
    private Bed bed;

    @NotNull
    @Column(name = "check_in_date", nullable = false)
    private LocalDate checkInDate;

    @Column(name = "check_out_date")
    private LocalDate checkOutDate;

    @NotNull
    @Column(name = "deposit_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal depositAmount;

    @NotNull
    @Column(name = "monthly_rent", nullable = false, precision = 10, scale = 2)
    private BigDecimal monthlyRent;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private AllocationStatus status = AllocationStatus.ACTIVE;

    /**
     * The date the tenant intends to vacate, set when a move-out notice is served.
     * Must be at least 30 days from the notice date.
     */
    @Column(name = "planned_checkout_date")
    private LocalDate plannedCheckoutDate;

    /**
     * The date on which the tenant formally served their move-out notice.
     * Automatically set to {@code LocalDate.now()} when notice request is submitted.
     */
    @Column(name = "notice_served_date")
    private LocalDate noticeServedDate;

    /**
     * The policy selected by the owner on approval: OFFSET_RENT or REFUND_AT_CHECKOUT.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "deposit_handling_policy", length = 30)
    private DepositHandlingPolicy depositHandlingPolicy;

    /**
     * The date on which the owner approved the notice request.
     */
    @Column(name = "notice_approval_date")
    private LocalDate noticeApprovalDate;

    /**
     * Explanation provided by the owner if the notice request is rejected.
     */
    @Column(name = "notice_rejection_reason", length = 500)
    private String noticeRejectionReason;
}
