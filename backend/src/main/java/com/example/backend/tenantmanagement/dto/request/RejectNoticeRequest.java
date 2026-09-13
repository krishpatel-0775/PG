package com.example.backend.tenantmanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload sent by PG Owner when rejecting a move-out notice request.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RejectNoticeRequest {

    /**
     * Explanation provided to the tenant for declining the move-out request.
     */
    @NotBlank(message = "Rejection reason is required")
    private String reason;
}
