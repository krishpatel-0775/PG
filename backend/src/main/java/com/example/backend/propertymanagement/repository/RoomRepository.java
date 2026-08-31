package com.example.backend.propertymanagement.repository;

import com.example.backend.propertymanagement.entity.Room;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link Room} entity.
 */
@Repository
public interface RoomRepository extends JpaRepository<Room, Long> {

    /**
     * Finds all rooms within a specific property.
     *
     * @param propertyId Property ID
     * @return List of rooms
     */
    List<Room> findByPropertyId(Long propertyId);

    /**
     * Checks if a room number already exists in a given property.
     *
     * @param propertyId Property ID
     * @param roomNumber Room number string (e.g., "101")
     * @return true if exists
     */
    boolean existsByPropertyIdAndRoomNumber(Long propertyId, String roomNumber);

    /**
     * Finds a room by its ID and property ID.
     *
     * @param id Room ID
     * @param propertyId Property ID
     * @return Optional containing Room if found
     */
    Optional<Room> findByIdAndPropertyId(Long id, Long propertyId);
}
