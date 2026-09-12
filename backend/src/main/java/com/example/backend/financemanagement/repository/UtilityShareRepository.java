package com.example.backend.financemanagement.repository;

import com.example.backend.financemanagement.entity.UtilityShare;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link UtilityShare} entity.
 */
@Repository
public interface UtilityShareRepository extends JpaRepository<UtilityShare, Long> {

    /**
     * Finds all utility shares generated for a given meter reading.
     */
    List<UtilityShare> findByMeterReadingId(Long meterReadingId);

    /**
     * Finds all utility shares linked to a specific allocation.
     */
    List<UtilityShare> findByAllocationId(Long allocationId);

    /**
     * Finds all utility shares for a specific tenant across all allocations.
     */
    List<UtilityShare> findByTenantId(Long tenantId);

    /**
     * Finds all utility shares for a tenant by traversing the allocation relationship.
     * Equivalent to findByTenantId but navigated through allocation.tenant.id.
     */
    List<UtilityShare> findByAllocationTenantId(Long tenantId);
}
