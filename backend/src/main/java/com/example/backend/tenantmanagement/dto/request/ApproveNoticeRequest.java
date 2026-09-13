package com.example.backend.tenantmanagement.dto.request;

import com.example.backend.tenantmanagement.entity.DepositHandlingPolicy;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload sent by PG Owner when approving a move-out notice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApproveNoticeRequest {

    /**
     * Required strategy: OFFSET_RENT or REFUND_AT_CHECKOUT.
     */
    @NotNull(message = "depositHandlingPolicy is required (OFFSET_RENT or REFUND_AT_CHECKOUT)")
    private DepositHandlingPolicy depositHandlingPolicy;

    /**
     * Optional remarks or instructions from the owner.
     */
    private String approvalNotes;
}
