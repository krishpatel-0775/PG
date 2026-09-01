package com.example.backend.tenantmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Detailed CRM Profile Response for a specific tenant.
 * Aggregates Personal Information, Current/Recent Stay Details, and Full Billing History.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantProfileResponse {

    // Personal Info
    private Long tenantId;
    private String name;
    private String phone;
    private String email;
    private boolean isShadowUser;

    // Stay Details
    private String propertyName;
    private String roomNumber;
    private String bedNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal depositAmount;
    private BigDecimal monthlyRent;
    private String allocationStatus;

    // Financial History
    private List<TenantInvoiceDTO> financialHistory;
}
