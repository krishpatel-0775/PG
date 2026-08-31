package com.example.backend.tenantmanagement.repository;

import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link Allocation} entity.
 */
@Repository
public interface AllocationRepository extends JpaRepository<Allocation, Long> {

    /**
     * Finds all allocations for a given tenant ID.
     */
    List<Allocation> findByTenantId(Long tenantId);

    /**
     * Finds allocations by tenant ID and allocation status.
     */
    List<Allocation> findByTenantIdAndStatus(Long tenantId, AllocationStatus status);

    /**
     * Finds the first active allocation for a tenant.
     */
    Optional<Allocation> findFirstByTenantIdAndStatus(Long tenantId, AllocationStatus status);

    /**
     * Finds all allocations for a given bed ID.
     */
    List<Allocation> findByBedId(Long bedId);

    /**
     * Finds all allocations by status.
     */
    List<Allocation> findByStatus(AllocationStatus status);

    /**
     * Finds all allocations for properties owned by a specific PG Owner and matching status.
     */
    List<Allocation> findByBedRoomPropertyOwnerIdAndStatus(Long ownerId, AllocationStatus status);

    /**
     * Finds all allocations for properties owned by a specific PG Owner.
     */
    List<Allocation> findByBedRoomPropertyOwnerId(Long ownerId);

    /**
     * Finds the active allocation for a specific bed.
     */
    Optional<Allocation> findFirstByBedIdAndStatus(Long bedId, AllocationStatus status);

    /**
     * Checks whether a tenant already has an active allocation.
     */
    boolean existsByTenantIdAndStatus(Long tenantId, AllocationStatus status);
}
