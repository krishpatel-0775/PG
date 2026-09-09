package com.example.backend.propertymanagement.repository;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Bed} entity.
 */
@Repository
public interface BedRepository extends JpaRepository<Bed, Long> {

    /**
     * Finds all beds belonging to a specific room.
     *
     * @param roomId Room ID
     * @return List of beds
     */
    List<Bed> findByRoomId(Long roomId);

    /**
     * Finds all beds within a specific property.
     *
     * @param propertyId Property ID
     * @return List of beds
     */
    List<Bed> findByRoomPropertyId(Long propertyId);

    /**
     * Counts beds in a property by their occupancy/maintenance status.
     *
     * @param propertyId Property ID
     * @param status Bed status (VACANT, OCCUPIED, MAINTENANCE)
     * @return Total count
     */
    long countByRoomPropertyIdAndStatus(Long propertyId, BedStatus status);

    /**
     * Counts all beds in a property.
     *
     * @param propertyId Property ID
     * @return Total count
     */
    long countByRoomPropertyId(Long propertyId);

    /**
     * Checks if a bed number exists in a room.
     *
     * @param roomId Room ID
     * @param bedNumber Bed number string
     * @return true if exists
     */
    boolean existsByRoomIdAndBedNumber(Long roomId, String bedNumber);

    /**
     * Checks if a bed number exists in a room, excluding a specific bed ID.
     *
     * @param roomId Room ID
     * @param bedNumber Bed number string
     * @param id Bed ID to exclude
     * @return true if exists
     */
    boolean existsByRoomIdAndBedNumberAndIdNot(Long roomId, String bedNumber, Long id);

    /**
     * Counts all beds belonging to a specific owner across all properties.
     */
    @Query("SELECT COUNT(b) FROM Bed b WHERE b.room.property.owner.id = :ownerId")
    long countByRoomPropertyOwnerId(@Param("ownerId") Long ownerId);

    /**
     * Counts beds belonging to a specific owner by status across all properties.
     */
    @Query("SELECT COUNT(b) FROM Bed b WHERE b.room.property.owner.id = :ownerId AND b.status = :status")
    long countByRoomPropertyOwnerIdAndStatus(@Param("ownerId") Long ownerId, @Param("status") BedStatus status);

    /**
     * Counts all beds in system by status (Super Admin).
     */
    @Query("SELECT COUNT(b) FROM Bed b WHERE b.status = :status")
    long countAllByStatus(@Param("status") BedStatus status);
}
