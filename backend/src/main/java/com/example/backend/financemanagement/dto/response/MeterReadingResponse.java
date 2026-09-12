package com.example.backend.financemanagement.dto.response;

import com.example.backend.propertymanagement.entity.MeterReading;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Response DTO representing a persisted meter reading record.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MeterReadingResponse {

    private Long id;
    private Long roomId;
    private String roomNumber;
    private String propertyName;
    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal unitsConsumed;
    private BigDecimal ratePerUnit;
    private BigDecimal totalAmount;
    private String billingMonth;
    private LocalDate readingDate;
    private String meterPhotoUrl;
    private LocalDateTime createdAt;

    public static MeterReadingResponse fromEntity(MeterReading r) {
        if (r == null) return null;
        var room = r.getRoom();
        var property = room != null ? room.getProperty() : null;
        return MeterReadingResponse.builder()
                .id(r.getId())
                .roomId(room != null ? room.getId() : null)
                .roomNumber(room != null ? room.getRoomNumber() : null)
                .propertyName(property != null ? property.getName() : null)
                .previousReading(r.getPreviousReading())
                .currentReading(r.getCurrentReading())
                .unitsConsumed(r.getUnitsConsumed())
                .ratePerUnit(r.getRatePerUnit())
                .totalAmount(r.getTotalAmount())
                .billingMonth(r.getBillingMonth())
                .readingDate(r.getReadingDate())
                .meterPhotoUrl(r.getMeterPhotoUrl())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
