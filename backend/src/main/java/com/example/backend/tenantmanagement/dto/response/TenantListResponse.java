package com.example.backend.tenantmanagement.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

/**
 * Summary DTO for the PG Owner CRM Tenant Directory listing.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantListResponse {

    private Long tenantId;
    private String name;
    private String phone;
    private String email;
    private String currentPropertyName;
    private String currentRoomBed;
    private LocalDate checkInDate;
    private String allocationStatus;
}
