package com.example.backend.propertymanagement.repository;

import com.example.backend.propertymanagement.entity.Bed;
import com.example.backend.propertymanagement.entity.BedStatus;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
