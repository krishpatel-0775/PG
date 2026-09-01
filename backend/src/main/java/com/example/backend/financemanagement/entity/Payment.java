package com.example.backend.financemanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Entity representing an individual payment transaction recorded against an invoice.
 */
@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "invoice")
@EqualsAndHashCode(exclude = "invoice")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;

    @NotNull
    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @NotNull
    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PaymentMode mode;

    @Column(name = "reference_id", length = 100)
    private String referenceId;

    @Column(name = "transaction_id", length = 100)
    private String transactionId;

    @Column(length = 255)
    private String remarks;

    /**
     * Helper getter to ensure referenceId and transactionId are interoperable.
     */
    public String getEffectiveReferenceId() {
        return referenceId != null ? referenceId : transactionId;
    }
}
