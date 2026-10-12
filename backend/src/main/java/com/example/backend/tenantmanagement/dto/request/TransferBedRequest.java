package com.example.backend.tenantmanagement.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for transferring a tenant to a new bed / room.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransferBedRequest {

    @NotNull(message = "New target Bed ID is required.")
    private Long newBedId;

    private BigDecimal newMonthlyRent;

    private BigDecimal newDepositAmount;

    @Builder.Default
    private boolean transferDeposit = true;

    @Builder.Default
    private boolean transferUnpaidInvoices = true;

    private LocalDate transferDate;

    private String reason;
}
