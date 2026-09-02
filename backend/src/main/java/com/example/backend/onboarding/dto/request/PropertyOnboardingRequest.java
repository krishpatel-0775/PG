package com.example.backend.onboarding.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload for simultaneous PG Owner account registration and first property listing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyOnboardingRequest {

    // Owner Account Details
    @NotBlank(message = "Owner name is required")
    @Size(max = 100, message = "Owner name must not exceed 100 characters")
    private String ownerName;

    @NotBlank(message = "Owner email is required")
    @Email(message = "Invalid owner email format")
    @Size(max = 100, message = "Email must not exceed 100 characters")
    private String ownerEmail;

    @NotBlank(message = "Owner phone is required")
    @Size(max = 20, message = "Phone must not exceed 20 characters")
    private String ownerPhone;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 120, message = "Password must be between 6 and 120 characters")
    private String password;

    // First Property Details
    @NotBlank(message = "Property name is required")
    @Size(max = 150, message = "Property name must not exceed 150 characters")
    private String propertyName;

    @NotBlank(message = "Property address is required")
    @Size(max = 255, message = "Address must not exceed 255 characters")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 100, message = "City must not exceed 100 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 100, message = "State must not exceed 100 characters")
    private String state;

    @NotNull(message = "Total floors is required")
    @Min(value = 1, message = "Property must have at least 1 floor")
    private Integer totalFloors;
}
