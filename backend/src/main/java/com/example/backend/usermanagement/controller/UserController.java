package com.example.backend.usermanagement.controller;

import com.example.backend.usermanagement.dto.request.ChangePasswordRequest;
import com.example.backend.usermanagement.dto.request.UpdateProfileRequest;
import com.example.backend.usermanagement.dto.response.UserProfileResponse;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import com.example.backend.usermanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.Optional;

/**
 * REST Controller providing user lookup, current profile inspection, profile updates,
 * and secure credential changes.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final UserService userService;

    public UserController(UserRepository userRepository, UserService userService) {
        this.userRepository = userRepository;
        this.userService = userService;
    }

    /**
     * Retrieves the profile of the currently authenticated user.
     */
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> getCurrentUser(Authentication authentication) {
        UserProfileResponse profile = userService.getCurrentUserProfile(authentication.getName());
        return ResponseEntity.ok(profile);
    }

    /**
     * Updates profile details (Full Name, Phone number) for the authenticated user.
     */
    @PutMapping("/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<UserProfileResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        UserProfileResponse updated = userService.updateProfile(authentication.getName(), request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Securely changes the account password for the authenticated user.
     */
    @PutMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, String>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        userService.changePassword(authentication.getName(), request);
        return ResponseEntity.ok(Map.of("message", "Password updated successfully!"));
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
