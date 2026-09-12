package com.example.backend.financemanagement.entity;

import com.example.backend.tenantmanagement.entity.Allocation;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Entity representing a billing invoice generated for a tenant's bed allocation.
 * Supports both anniversary rent invoices ({@link InvoiceType#RENT}) and
 * prorated utility/electricity invoices ({@link InvoiceType#UTILITY}).
 */
@Entity
@Table(name = "invoices")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = {"allocation", "payments"})
@EqualsAndHashCode(exclude = {"allocation", "payments"})
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "allocation_id", nullable = false)
    private Allocation allocation;

    /**
     * Distinguishes rent invoices from utility (electricity) invoices.
     * Defaults to {@link InvoiceType#RENT} for backward compatibility.
     */
    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(name = "invoice_type", columnDefinition = "varchar(20) default 'RENT'", length = 20)
    @Builder.Default
    private InvoiceType invoiceType = InvoiceType.RENT;

    @NotNull
    @Column(name = "invoice_date", nullable = false)
    private LocalDate invoiceDate;

    @NotNull
    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @NotNull
    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @NotNull
    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal amountPaid = BigDecimal.ZERO;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    @Builder.Default
    private InvoiceStatus status = InvoiceStatus.UNPAID;

    @Column(name = "invoice_month", length = 20)
    private String invoiceMonth;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @Builder.Default
    private List<Payment> payments = new ArrayList<>();
}
