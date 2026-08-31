package com.example.backend.usermanagement.controller;

import com.example.backend.usermanagement.dto.response.UserProfileResponse;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * REST Controller providing user lookup and profile inspection endpoints for PG Owners and Admins.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Looks up user details by mobile phone number (or email fallback) to support form auto-completion
     * and shadow user verification.
     *
     * @param phone Mobile phone number
     * @param email (Optional) Email address
     * @return UserProfileResponse if found, 404 if user does not exist
     */
    @GetMapping("/lookup")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<UserProfileResponse> lookupUser(
            @RequestParam(value = "phone", required = false) String phone,
            @RequestParam(value = "email", required = false) String email) {

        Optional<User> userOpt = Optional.empty();

        if (phone != null && !phone.trim().isEmpty()) {
            userOpt = userRepository.findByPhone(phone.trim());
        } else if (email != null && !email.trim().isEmpty()) {
            userOpt = userRepository.findByEmail(email.trim().toLowerCase());
        } else {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Phone number or email parameter is required for lookup");
        }

        User user = userOpt.orElseThrow(() -> new ResponseStatusException(
                HttpStatus.NOT_FOUND,
                phone != null ? "No user found with phone: " + phone : "No user found with email: " + email
        ));

        return ResponseEntity.ok(UserProfileResponse.fromEntity(user));
    }
}
