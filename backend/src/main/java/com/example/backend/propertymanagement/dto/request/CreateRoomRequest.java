package com.example.backend.propertymanagement.dto.request;

import com.example.backend.propertymanagement.entity.RoomType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for adding a new room to a property.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateRoomRequest {

    @NotBlank(message = "Room number is required")
    @Size(max = 20, message = "Room number cannot exceed 20 characters")
    private String roomNumber;

    @NotNull(message = "Floor number is required")
    @Min(value = 0, message = "Floor number cannot be negative")
    private Integer floor;

    @NotNull(message = "Room type is required (SINGLE, DOUBLE, TRIPLE, FOUR_SHARING)")
    private RoomType roomType;

    @NotNull(message = "Base rent is required")
    @DecimalMin(value = "0.0", message = "Base rent cannot be negative")
    private Double baseRent;

    private boolean hasAc;
}
