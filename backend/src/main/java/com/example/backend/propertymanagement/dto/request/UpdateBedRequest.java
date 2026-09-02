package com.example.backend.propertymanagement.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for updating an existing bed's identifier.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateBedRequest {

    @NotBlank(message = "Bed number is required")
    @Size(max = 30, message = "Bed number cannot exceed 30 characters")
    private String bedNumber;
}
