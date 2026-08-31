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

    boolean existsByAllocationIdAndInvoiceMonth(Long allocationId, String invoiceMonth);
}
