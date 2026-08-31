package com.example.backend.usermanagement.repository;

import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@link User} entities.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * Finds a user by their email address.
     *
     * @param email Email address to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByEmail(String email);

    /**
     * Checks if a user exists with the given email address.
     *
     * @param email Email address to verify
     * @return true if a user exists with the given email
     */
    Boolean existsByEmail(String email);

    /**
     * Finds a user by their phone number.
     *
     * @param phone Phone number to search for
     * @return Optional containing the user if found
     */
    Optional<User> findByPhone(String phone);

    /**
     * Checks if a user exists with the given phone number.
     *
     * @param phone Phone number to verify
     * @return true if a user exists with the given phone number
     */
    Boolean existsByPhone(String phone);

    /**
     * Finds all users assigned with the given role.
     *
     * @param role User role to filter by
     * @return List of matching users
     */
    List<User> findByRole(Role role);
}
