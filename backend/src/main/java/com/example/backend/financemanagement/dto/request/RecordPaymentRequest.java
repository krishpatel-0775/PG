package com.example.backend.financemanagement.dto.request;

import com.example.backend.financemanagement.entity.PaymentMode;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Request DTO for recording a manual or offline payment (Cash, UPI, Online) against an invoice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RecordPaymentRequest {

    @NotNull(message = "Invoice ID is required")
    private Long invoiceId;

    @NotNull(message = "Payment amount is required")
    @DecimalMin(value = "0.01", inclusive = true, message = "Payment amount must be greater than 0")
    private BigDecimal amount;

    @NotNull(message = "Payment mode is required (CASH, UPI, ONLINE)")
    private PaymentMode mode;

    @Size(max = 100, message = "Reference ID cannot exceed 100 characters")
    private String referenceId;
}
