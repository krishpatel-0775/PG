package com.example.backend.propertymanagement.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for updating an existing room's identifier and details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateRoomRequest {

    @NotBlank(message = "Room number is required")
    @Size(max = 20, message = "Room number cannot exceed 20 characters")
    private String roomNumber;

    @Min(value = 0, message = "Floor number cannot be negative")
    private Integer floor;

    @DecimalMin(value = "0.0", message = "Base rent cannot be negative")
    private Double baseRent;

    private Boolean hasAc;
}
