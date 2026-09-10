package com.example.backend.usermanagement.service.impl;

import com.example.backend.usermanagement.dto.request.ChangePasswordRequest;
import com.example.backend.usermanagement.dto.request.UpdateProfileRequest;
import com.example.backend.usermanagement.dto.response.UserProfileResponse;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import com.example.backend.usermanagement.service.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Implementation of {@link UserService} managing user profile inspection,
 * safe profile attribute updates, and secure password changes.
 */
@Service
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUserProfile(String email) {
        User user = getUserByEmail(email);
        return UserProfileResponse.fromEntity(user);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(String email, UpdateProfileRequest request) {
        User user = getUserByEmail(email);

        // 1. Validate phone number uniqueness if modified
        String newPhone = request.getPhone() != null && !request.getPhone().trim().isEmpty()
                ? request.getPhone().trim()
                : null;

        if (newPhone != null && !newPhone.equals(user.getPhone())) {
            Optional<User> existingWithPhone = userRepository.findByPhone(newPhone);
            if (existingWithPhone.isPresent() && !existingWithPhone.get().getId().equals(user.getId())) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number is already associated with another account: " + newPhone);
            }
            user.setPhone(newPhone);
        } else if (request.getPhone() != null && request.getPhone().trim().isEmpty()) {
            user.setPhone(null);
        }

        // 2. Update Name
        user.setName(request.getName().trim());

        User savedUser = userRepository.save(user);
        log.info("Updated profile details for user ID {} ({})", savedUser.getId(), savedUser.getEmail());

        return UserProfileResponse.fromEntity(savedUser);
    }

    @Override
    @Transactional
    public void changePassword(String email, ChangePasswordRequest request) {
        User user = getUserByEmail(email);

        // 1. Verify current password matches
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "The current password you entered is incorrect.");
        }

        // 2. Verify new password and confirm password match
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password and confirmation password do not match.");
        }

        // 3. Ensure new password is not identical to current
        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password cannot be the same as your current password.");
        }

        // 4. Encode and save updated password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Successfully updated account password for user ID {} ({})", user.getId(), user.getEmail());
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User profile not found: " + email));
    }
}
