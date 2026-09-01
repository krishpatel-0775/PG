package com.example.backend.financemanagement.dto.response;

import com.example.backend.financemanagement.entity.Payment;
import com.example.backend.financemanagement.entity.PaymentMode;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response payload representing a recorded payment transaction.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PaymentResponse {

    private Long id;
    private Long invoiceId;
    private BigDecimal amount;
    private LocalDate paymentDate;
    private PaymentMode mode;
    private String referenceId;
    private String transactionId;
    private String remarks;

    public static PaymentResponse fromEntity(Payment payment) {
        if (payment == null) return null;
        String refId = payment.getReferenceId() != null ? payment.getReferenceId() : payment.getTransactionId();
        return PaymentResponse.builder()
                .id(payment.getId())
                .invoiceId(payment.getInvoice() != null ? payment.getInvoice().getId() : null)
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .mode(payment.getMode())
                .referenceId(refId)
                .transactionId(refId)
                .remarks(payment.getRemarks())
                .build();
    }
}
