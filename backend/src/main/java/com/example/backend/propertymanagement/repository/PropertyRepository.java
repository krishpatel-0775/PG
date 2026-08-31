package com.example.backend.propertymanagement.repository;

import com.example.backend.propertymanagement.entity.Property;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA Repository for {@link Property} entity.
 */
@Repository
public interface PropertyRepository extends JpaRepository<Property, Long> {

    /**
     * Finds all properties owned by a specific user.
     *
     * @param ownerId ID of the property owner
     * @return List of properties
     */
    List<Property> findByOwnerId(Long ownerId);

    /**
     * Finds a property by its ID and owner ID.
     *
     * @param id Property ID
     * @param ownerId Owner ID
     * @return Optional containing Property if found
     */
    Optional<Property> findByIdAndOwnerId(Long id, Long ownerId);

    /**
     * Checks if a property with given name already exists for an owner.
     *
     * @param name Property name
     * @param ownerId Owner ID
     * @return true if exists
     */
    boolean existsByNameAndOwnerId(String name, Long ownerId);
}
