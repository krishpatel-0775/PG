package com.example.backend.tenantmanagement.dto.response;

import com.example.backend.tenantmanagement.entity.CheckoutClearance;
import com.example.backend.tenantmanagement.entity.DamageItem;
import com.example.backend.tenantmanagement.entity.RefundStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Full checkout clearance settlement statement returned after finalization
 * or when a tenant views their settlement via {@code GET /api/checkout/tenant/my-settlement}.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutClearanceResponse {

    private Long id;
    private Long allocationId;
    private Long tenantId;
    private String tenantName;
    private String tenantEmail;
    private String bedNumber;
    private String roomNumber;
    private String propertyName;

    private BigDecimal initialDeposit;
    private BigDecimal depositUsedForRent;
    private BigDecimal remainingDeposit;
    private BigDecimal unpaidDuesDeducted;
    private BigDecimal damageDeductions;

    /** Net refund amount. Negative means tenant owes this amount. */
    private BigDecimal netRefundAmount;

    private RefundStatus refundStatus;
    private String transactionReference;
    private LocalDate settlementDate;
    private String remarks;

    /** Itemized damage charges. */
    private List<DamageItemResponse> damageItems;

    public static CheckoutClearanceResponse fromEntity(CheckoutClearance c) {
        if (c == null) return null;

        var allocation = c.getAllocation();
        var tenant = allocation != null ? allocation.getTenant() : null;
        var bed = allocation != null ? allocation.getBed() : null;
        var room = bed != null ? bed.getRoom() : null;
        var property = room != null ? room.getProperty() : null;

        List<DamageItemResponse> damages = c.getDamageItems() != null
                ? c.getDamageItems().stream().map(DamageItemResponse::fromEntity).collect(Collectors.toList())
                : Collections.emptyList();

        return CheckoutClearanceResponse.builder()
                .id(c.getId())
                .allocationId(allocation != null ? allocation.getId() : null)
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(tenant != null ? tenant.getName() : null)
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .bedNumber(bed != null ? bed.getBedNumber() : null)
                .roomNumber(room != null ? room.getRoomNumber() : null)
                .propertyName(property != null ? property.getName() : null)
                .initialDeposit(c.getInitialDeposit())
                .depositUsedForRent(c.getDepositUsedForRent())
                .remainingDeposit(c.getRemainingDeposit())
                .unpaidDuesDeducted(c.getUnpaidDuesDeducted())
                .damageDeductions(c.getDamageDeductions())
                .netRefundAmount(c.getNetRefundAmount())
                .refundStatus(c.getRefundStatus())
                .transactionReference(c.getTransactionReference())
                .settlementDate(c.getSettlementDate())
                .remarks(c.getRemarks())
                .damageItems(damages)
                .build();
    }

    /**
     * Nested DTO for damage line items within the clearance response.
     */
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class DamageItemResponse {
        private Long id;
        private String description;
        private BigDecimal amount;

        public static DamageItemResponse fromEntity(DamageItem item) {
            if (item == null) return null;
            return DamageItemResponse.builder()
                    .id(item.getId())
                    .description(item.getDescription())
                    .amount(item.getAmount())
                    .build();
        }
    }
}
