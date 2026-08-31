package com.example.backend.tenantmanagement.dto.response;

import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Response payload representing a tenant's bed allocation details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AllocationResponse {

    private Long id;
    private Long tenantId;
    private String tenantName;
    private String tenantEmail;
    private String tenantPhone;
    private Long propertyId;
    private String propertyName;
    private String propertyAddress;
    private Long roomId;
    private String roomNumber;
    private Integer floor;
    private Long bedId;
    private String bedNumber;
    private LocalDate checkInDate;
    private LocalDate checkOutDate;
    private BigDecimal depositAmount;
    private BigDecimal monthlyRent;
    private AllocationStatus status;

    /**
     * Factory method mapping an Allocation entity to AllocationResponse DTO.
     */
    public static AllocationResponse fromEntity(Allocation allocation) {
        if (allocation == null) return null;

        var tenant = allocation.getTenant();
        var bed = allocation.getBed();
        var room = bed != null ? bed.getRoom() : null;
        var property = room != null ? room.getProperty() : null;

        return AllocationResponse.builder()
                .id(allocation.getId())
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(tenant != null ? tenant.getName() : null)
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .tenantPhone(tenant != null ? tenant.getPhone() : null)
                .propertyId(property != null ? property.getId() : null)
                .propertyName(property != null ? property.getName() : null)
                .propertyAddress(property != null ? property.getAddress() : null)
                .roomId(room != null ? room.getId() : null)
                .roomNumber(room != null ? room.getRoomNumber() : null)
                .floor(room != null ? room.getFloor() : null)
                .bedId(bed != null ? bed.getId() : null)
                .bedNumber(bed != null ? bed.getBedNumber() : null)
                .checkInDate(allocation.getCheckInDate())
                .checkOutDate(allocation.getCheckOutDate())
                .depositAmount(allocation.getDepositAmount())
                .monthlyRent(allocation.getMonthlyRent())
                .status(allocation.getStatus())
                .build();
    }
}
