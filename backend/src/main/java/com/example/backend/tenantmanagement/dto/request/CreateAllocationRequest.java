package com.example.backend.tenantmanagement.dto.request;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request payload for allocating a bed to a tenant by mobile phone number.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAllocationRequest {

    @NotBlank(message = "Tenant mobile number is required")
    @Size(max = 20, message = "Phone number cannot exceed 20 characters")
    private String tenantPhone;

    @NotBlank(message = "Tenant name is required")
    @Size(max = 100, message = "Tenant name cannot exceed 100 characters")
    private String tenantName;

    @Email(message = "Please provide a valid email format if provided")
    private String tenantEmail;

    private Long tenantId;

    @NotNull(message = "Bed ID is required")
    private Long bedId;

    @NotNull(message = "Check-in date is required")
    private LocalDate checkInDate;

    @NotNull(message = "Deposit amount is required")
    @DecimalMin(value = "0.0", message = "Deposit amount cannot be negative")
    private BigDecimal depositAmount;

    @NotNull(message = "Monthly rent is required")
    @DecimalMin(value = "0.0", message = "Monthly rent cannot be negative")
    private BigDecimal monthlyRent;
}
