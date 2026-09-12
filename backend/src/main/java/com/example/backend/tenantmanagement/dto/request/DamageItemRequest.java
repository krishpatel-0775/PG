package com.example.backend.tenantmanagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Represents a single physical damage item assessed during tenant checkout clearance.
 */
@Data
public class DamageItemRequest {

    @NotBlank(message = "Damage description is required")
    private String description;

    @NotNull(message = "Damage amount is required")
    @DecimalMin(value = "0.01", message = "Damage amount must be greater than zero")
    private BigDecimal amount;
}
