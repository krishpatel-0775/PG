package com.example.backend.financemanagement.dto.response;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
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
 * Response payload representing an invoice with billing, tenant, property, and payment history details.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvoiceResponse {

    private Long id;
    private Long allocationId;
    private Long tenantId;
    private String tenantName;
    private String tenantPhone;
    private String tenantEmail;
    private Long propertyId;
    private String propertyName;
    private String propertyAddress;
    private Long roomId;
    private String roomNumber;
    private Long bedId;
    private String bedNumber;
    private String invoiceMonth;
    private BigDecimal totalAmount;
    private BigDecimal amountPaid;
    private BigDecimal dueAmount;
    private LocalDate dueDate;
    private InvoiceStatus status;
    private List<PaymentResponse> payments;

    public static InvoiceResponse fromEntity(Invoice invoice) {
        if (invoice == null) return null;

        var allocation = invoice.getAllocation();
        var tenant = allocation != null ? allocation.getTenant() : null;
        var bed = allocation != null ? allocation.getBed() : null;
        var room = bed != null ? bed.getRoom() : null;
        var property = room != null ? room.getProperty() : null;

        BigDecimal total = invoice.getTotalAmount() != null ? invoice.getTotalAmount() : BigDecimal.ZERO;
        BigDecimal paid = invoice.getAmountPaid() != null ? invoice.getAmountPaid() : BigDecimal.ZERO;
        BigDecimal due = total.subtract(paid).max(BigDecimal.ZERO);

        List<PaymentResponse> paymentList = invoice.getPayments() != null
                ? invoice.getPayments().stream().map(PaymentResponse::fromEntity).collect(Collectors.toList())
                : Collections.emptyList();

        return InvoiceResponse.builder()
                .id(invoice.getId())
                .allocationId(allocation != null ? allocation.getId() : null)
                .tenantId(tenant != null ? tenant.getId() : null)
                .tenantName(tenant != null ? tenant.getName() : null)
                .tenantPhone(tenant != null ? tenant.getPhone() : null)
                .tenantEmail(tenant != null ? tenant.getEmail() : null)
                .propertyId(property != null ? property.getId() : null)
                .propertyName(property != null ? property.getName() : null)
                .propertyAddress(property != null ? property.getAddress() : null)
                .roomId(room != null ? room.getId() : null)
                .roomNumber(room != null ? room.getRoomNumber() : null)
                .bedId(bed != null ? bed.getId() : null)
                .bedNumber(bed != null ? bed.getBedNumber() : null)
                .invoiceMonth(invoice.getInvoiceMonth())
                .totalAmount(invoice.getTotalAmount())
                .amountPaid(invoice.getAmountPaid())
                .dueAmount(due)
                .dueDate(invoice.getDueDate())
                .status(invoice.getStatus())
                .payments(paymentList)
                .build();
    }
}
