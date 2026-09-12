package com.example.backend.tenantmanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;

/**
 * Entity representing an individual physical damage item assessed during move-out clearance.
 * Multiple damage items can be linked to a single {@link CheckoutClearance}.
 */
@Entity
@Table(name = "damage_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "clearance")
@EqualsAndHashCode(exclude = "clearance")
public class DamageItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "clearance_id", nullable = false)
    private CheckoutClearance clearance;

    /**
     * Human-readable description of the damage, e.g. "Repaint room walls", "Broken geyser replacement".
     */
    @NotBlank
    @Column(nullable = false, length = 300)
    private String description;

    /**
     * Assessed cost in INR for this damage item.
     */
    @NotNull
    @DecimalMin(value = "0.01")
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;
}
