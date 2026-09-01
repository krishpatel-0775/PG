package com.example.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Complaint volume breakdown by category.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintDataDTO {

    private String category;
    private int count;
}
