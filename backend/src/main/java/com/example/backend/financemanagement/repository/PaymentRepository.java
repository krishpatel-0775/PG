package com.example.backend.financemanagement.repository;

import com.example.backend.financemanagement.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Payment} entity.
 */
@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    /**
     * Finds all payment transactions recorded for a given invoice ID.
     */
    List<Payment> findByInvoiceId(Long invoiceId);

    /**
     * Finds all payments made by a specific tenant across all invoices.
     */
    List<Payment> findByInvoiceAllocationTenantId(Long tenantId);
}
