package com.example.backend.tenantmanagement.dto.response;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Nested financial invoice DTO for tenant profile CRM breakdown.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TenantInvoiceDTO {

    private Long invoiceId;
    private LocalDate invoiceDate;
    private LocalDate dueDate;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal dueAmount;
    private InvoiceStatus status;

    public static TenantInvoiceDTO fromEntity(Invoice invoice) {
        if (invoice == null) return null;

        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal paid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal due = total.subtract(paid).max(BigDecimal.ZERO);

        return TenantInvoiceDTO.builder()
                .invoiceId(invoice.getId())
                .invoiceDate(invoice.getInvoiceDate())
                .dueDate(invoice.getDueDate())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(invoice.getAmountPaid())
                .dueAmount(due)
                .status(invoice.getStatus())
                .build();
    }
}
