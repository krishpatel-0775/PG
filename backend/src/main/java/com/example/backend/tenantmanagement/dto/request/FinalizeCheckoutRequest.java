package com.example.backend.tenantmanagement.dto.request;

import com.example.backend.financemanagement.entity.PaymentMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Request payload to finalize tenant checkout and settle the security deposit.
 * Contains itemized damage assessments, payment metadata, and optional remarks.
 */
@Data
public class FinalizeCheckoutRequest {

    /**
     * Itemized list of physical damages assessed by the owner. May be empty.
     */
    @Valid
    private List<DamageItemRequest> damages = new ArrayList<>();

    /**
     * Payment mode used to disburse the net refund (if positive) or collect shortfall.
     */
    @NotNull(message = "paymentMode is required")
    private PaymentMode paymentMode;

    /**
     * UPI UTR / NEFT reference / cheque number for the actual refund or recovery transaction.
     */
    private String transactionReference;

    /**
     * Additional notes from the owner (e.g. "Repaint completed", "Tenant accepted settlement").
     */
    private String remarks;
}
