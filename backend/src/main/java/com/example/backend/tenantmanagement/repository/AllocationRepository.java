package com.example.backend.tenantmanagement.repository;

import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
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
     * Finds all allocations for a tenant ordered by check-in date descending (most recent first).
     */
    List<Allocation> findByTenantIdOrderByCheckInDateDesc(Long tenantId);

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
     * Finds all allocations for properties owned by a specific PG Owner ordered by check-in date descending.
     */
    List<Allocation> findByBedRoomPropertyOwnerIdOrderByCheckInDateDesc(Long ownerId);

    /**
     * Finds the active allocation for a specific bed.
     */
    Optional<Allocation> findFirstByBedIdAndStatus(Long bedId, AllocationStatus status);

    /**
     * Checks whether a tenant already has an active allocation.
     */
    boolean existsByTenantIdAndStatus(Long tenantId, AllocationStatus status);

    /**
     * Verifies if an owner has ever allocated a bed to a specific tenant (for CRM security checks).
     */
    boolean existsByTenantIdAndBedRoomPropertyOwnerId(Long tenantId, Long ownerId);

    /**
     * Counts new allocations for a property checked in within a date range (e.g. current month).
     */
    long countByBedRoomPropertyIdAndCheckInDateBetween(Long propertyId, LocalDate startDate, LocalDate endDate);

    /**
     * Sums monthly rent across allocations for a property matching a given status (e.g. ACTIVE).
     */
    @Query("SELECT COALESCE(SUM(a.monthlyRent), 0) FROM Allocation a " +
           "WHERE a.bed.room.property.id = :propertyId " +
           "AND a.status = :status")
    BigDecimal sumMonthlyRentByPropertyIdAndStatus(
            @Param("propertyId") Long propertyId,
            @Param("status") AllocationStatus status);
}
