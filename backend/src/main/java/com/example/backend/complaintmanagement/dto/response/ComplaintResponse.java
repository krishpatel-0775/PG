package com.example.backend.complaintmanagement.dto.response;

import com.example.backend.complaintmanagement.entity.Complaint;
import com.example.backend.complaintmanagement.entity.ComplaintCategory;
import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response payload representing a complaint ticket with tenant and property context.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ComplaintResponse {

    private Long id;
    private Long tenantId;
    private String tenantName;
    private String tenantPhone;
    private String tenantEmail;
    private Long propertyId;
    private String propertyName;
    private String propertyAddress;
    private ComplaintCategory category;
    private String title;
    private String description;
    private ComplaintStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
    private String remarks;

    public static ComplaintResponse fromEntity(Complaint complaint) {
        if (complaint == null) return null;

        var tenant = complaint.getTenant();
        var property = complaint.getProperty();

        return ComplaintResponse.builder()
                .id(complaint.getId())
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(tenant != null ? tenant.getName() : null)
                .tenantPhone(tenant != null ? tenant.getPhone() : null)
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .propertyId(property != null ? property.getId() : null)
                .propertyName(property != null ? property.getName() : null)
                .propertyAddress(property != null ? property.getAddress() : null)
                .category(complaint.getCategory())
                .title(complaint.getTitle())
                .description(complaint.getDescription())
                .status(complaint.getStatus())
                .createdAt(complaint.getCreatedAt())
                .resolvedAt(complaint.getResolvedAt())
                .remarks(complaint.getRemarks())
                .build();
    }
}
