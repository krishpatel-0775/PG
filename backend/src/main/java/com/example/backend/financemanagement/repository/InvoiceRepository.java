package com.example.backend.financemanagement.repository;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Invoice} entity.
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByAllocationId(Long allocationId);

    List<Invoice> findByStatus(InvoiceStatus status);

    List<Invoice> findByStatusIn(List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationTenantId(Long tenantId);

    List<Invoice> findByAllocationTenantIdAndStatusIn(Long tenantId, List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationBedRoomPropertyOwnerId(Long ownerId);

    List<Invoice> findByAllocationBedRoomPropertyOwnerIdAndStatusIn(Long ownerId, List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationBedRoomPropertyIdAndStatusIn(Long propertyId, List<InvoiceStatus> statuses);

    @org.springframework.data.jpa.repository.Query("SELECT COALESCE(SUM(i.totalAmount - i.amountPaid), 0) FROM Invoice i " +
           "WHERE i.allocation.bed.room.property.id = :propertyId " +
           "AND i.status IN :statuses")
    java.math.BigDecimal sumOutstandingDuesByPropertyIdAndStatusIn(
            @org.springframework.data.repository.query.Param("propertyId") Long propertyId,
            @org.springframework.data.repository.query.Param("statuses") List<InvoiceStatus> statuses);

    boolean existsByAllocationIdAndInvoiceMonth(Long allocationId, String invoiceMonth);
}
