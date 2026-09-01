package com.example.backend.analytics.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

/**
 * Monthly revenue performance breakdown data point.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RevenueDataDTO {

    private String month;
    private BigDecimal collected;
    private BigDecimal pending;
}
