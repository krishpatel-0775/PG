package com.example.backend.financemanagement.repository;

import com.example.backend.financemanagement.entity.Invoice;
import com.example.backend.financemanagement.entity.InvoiceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/**
 * Spring Data JPA Repository for {@link Invoice} entity.
 */
@Repository
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findByAllocationId(Long allocationId);

    List<Invoice> findByStatus(InvoiceStatus status);

    boolean existsByAllocationIdAndInvoiceDate(Long allocationId, LocalDate invoiceDate);

    List<Invoice> findByStatusIn(List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationTenantId(Long tenantId);

    List<Invoice> findByAllocationTenantIdAndStatusIn(Long tenantId, List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationBedRoomPropertyOwnerId(Long ownerId);

    List<Invoice> findByAllocationBedRoomPropertyOwnerIdAndStatusIn(Long ownerId, List<InvoiceStatus> statuses);

    List<Invoice> findByAllocationBedRoomPropertyIdAndStatusIn(Long propertyId, List<InvoiceStatus> statuses);

    @Query("SELECT COALESCE(SUM(i.totalAmount - i.amountPaid), 0) FROM Invoice i " +
           "WHERE i.allocation.bed.room.property.id = :propertyId " +
           "AND i.status IN :statuses")
    BigDecimal sumOutstandingDuesByPropertyIdAndStatusIn(
            @Param("propertyId") Long propertyId,
            @Param("statuses") List<InvoiceStatus> statuses);

    /**
     * Sums collected rent (amountPaid) for a property within a specific invoice date range.
     */
    @Query("SELECT COALESCE(SUM(i.amountPaid), 0) FROM Invoice i " +
           "WHERE i.allocation.bed.room.property.id = :propertyId " +
           "AND i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    BigDecimal sumAmountPaidByPropertyIdAndInvoiceDateBetween(
            @Param("propertyId") Long propertyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Sums pending/unpaid rent (totalAmount - amountPaid) for a property within a specific invoice date range.
     */
    @Query("SELECT COALESCE(SUM(i.totalAmount - i.amountPaid), 0) FROM Invoice i " +
           "WHERE i.allocation.bed.room.property.id = :propertyId " +
           "AND i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    BigDecimal sumOutstandingByPropertyIdAndInvoiceDateBetween(
            @Param("propertyId") Long propertyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    /**
     * Sums total expected rent (totalAmount) for a property within a specific invoice date range.
     */
    @Query("SELECT COALESCE(SUM(i.totalAmount), 0) FROM Invoice i " +
           "WHERE i.allocation.bed.room.property.id = :propertyId " +
           "AND i.invoiceDate >= :startDate AND i.invoiceDate <= :endDate")
    BigDecimal sumTotalAmountByPropertyIdAndInvoiceDateBetween(
            @Param("propertyId") Long propertyId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByAllocationIdAndInvoiceMonth(Long allocationId, String invoiceMonth);
}
