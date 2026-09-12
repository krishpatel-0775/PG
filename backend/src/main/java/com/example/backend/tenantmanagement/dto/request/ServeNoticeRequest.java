package com.example.backend.tenantmanagement.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

/**
 * Request payload for a tenant to serve a move-out notice.
 * The planned checkout date must be at least 30 days from today.
 */
@Data
public class ServeNoticeRequest {

    /**
     * The date the tenant plans to vacate the bed.
     * Must be in the future and at least 30 days from today (validated in service layer).
     */
    @NotNull(message = "plannedCheckoutDate is required")
    @Future(message = "plannedCheckoutDate must be in the future")
    @JsonFormat(pattern = "yyyy-MM-dd")
    private LocalDate plannedCheckoutDate;
}
