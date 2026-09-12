package com.example.backend.financemanagement.dto.response;

import com.example.backend.financemanagement.entity.UtilityShareStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Committed utility share response — returned after a billing commit operation.
 * Includes invoice details so the caller knows the invoice that was generated.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UtilityShareResponse {

    private Long id;
    private Long meterReadingId;
    private String billingMonth;
    private Long allocationId;
    private Long tenantId;
    private String tenantName;
    private String tenantEmail;
    private Long bedId;
    private String bedNumber;
    private String roomNumber;
    private Integer roomCapacity;
    private BigDecimal previousReading;
    private BigDecimal currentReading;
    private BigDecimal unitsConsumed;
    private BigDecimal ratePerUnit;
    private BigDecimal totalRoomCost;
    private Integer daysOccupied;
    private Integer totalDaysInMonth;
    private BigDecimal shareAmount;
    private UtilityShareStatus status;

    /** ID of the UTILITY invoice generated for this share. Null if status = CALCULATED. */
    private Long invoiceId;
    private LocalDate invoiceDueDate;
}
