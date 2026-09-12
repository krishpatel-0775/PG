package com.example.backend.tenantmanagement.repository;

import com.example.backend.tenantmanagement.entity.CheckoutClearance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link CheckoutClearance} entity.
 */
@Repository
public interface CheckoutClearanceRepository extends JpaRepository<CheckoutClearance, Long> {

    /**
     * Finds the clearance record for a specific allocation.
     */
    Optional<CheckoutClearance> findByAllocationId(Long allocationId);

    /**
     * Finds the clearance record for the tenant's most recent allocation.
     */
    Optional<CheckoutClearance> findByAllocationTenantId(Long tenantId);
}
