package com.example.backend.propertymanagement.repository;

import com.example.backend.propertymanagement.entity.MeterReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link MeterReading} entity.
 */
@Repository
public interface MeterReadingRepository extends JpaRepository<MeterReading, Long> {

    /**
     * Finds all meter readings for a given room, ordered by reading date descending (most recent first).
     */
    List<MeterReading> findByRoomIdOrderByReadingDateDesc(Long roomId);

    /**
     * Finds the most recent meter reading for a room — used to auto-populate previousReading
     * when submitting a new reading.
     */
    Optional<MeterReading> findTopByRoomIdOrderByReadingDateDesc(Long roomId);

    /**
     * Checks whether a meter reading already exists for the given room and billing month
     * to prevent duplicate billing for the same cycle.
     */
    boolean existsByRoomIdAndBillingMonth(Long roomId, String billingMonth);

    /**
     * Finds all meter readings for a given room (unordered).
     */
    List<MeterReading> findByRoomId(Long roomId);
}
