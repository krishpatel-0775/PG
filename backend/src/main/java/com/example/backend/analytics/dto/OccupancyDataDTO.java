package com.example.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Bed occupancy metrics breakdown data point.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OccupancyDataDTO {

    private int occupied;
    private int vacant;
    private int maintenance;
}
