package com.example.backend.propertymanagement.dto.response;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response payload representing an individual bed.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BedResponse {

    private Long id;
    private Long roomId;
    private String bedNumber;
    private BedStatus status;
    private Long currentTenantId;

    /**
     * Factory method mapping a Bed entity to BedResponse DTO.
     *
     * @param bed Bed entity
     * @return Populated BedResponse DTO
     */
    public static BedResponse fromEntity(Bed bed) {
        if (bed == null) return null;
        return BedResponse.builder()
                .id(bed.getId())
                .roomId(bed.getRoom() != null ? bed.getRoom().getId() : null)
                .bedNumber(bed.getBedNumber())
                .status(bed.getStatus())
                .currentTenantId(bed.getCurrentTenantId())
                .build();
    }
}
