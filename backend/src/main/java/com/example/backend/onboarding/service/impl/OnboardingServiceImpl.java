package com.example.backend.onboarding.service.impl;

import com.example.backend.onboarding.dto.request.PropertyOnboardingRequest;
import com.example.backend.onboarding.dto.response.PropertyOnboardingResponse;
import com.example.backend.onboarding.service.OnboardingService;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Implementation of {@link OnboardingService} executing transactional registration of
 * PG Owner accounts alongside their primary PG Property.
 */
@Service
public class OnboardingServiceImpl implements OnboardingService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final PasswordEncoder passwordEncoder;

    public OnboardingServiceImpl(UserRepository userRepository,
                                 PropertyRepository propertyRepository,
                                 PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Atomically registers a PG Owner and provisions their first PG Property in a single transaction.
     */
    @Override
    @Transactional
    public PropertyOnboardingResponse onboardNewPg(PropertyOnboardingRequest request) {
        String email = request.getOwnerEmail().trim().toLowerCase();
        String phone = request.getOwnerPhone().trim();

        // 1. Verify email uniqueness
        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email address is already registered: " + email);
        }

        // 2. Verify phone uniqueness
        if (userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Phone number is already registered: " + phone);
        }

        // 3. Create and persist the PG_OWNER User entity
        User owner = User.builder()
                .name(request.getOwnerName().trim())
                .email(email)
                .phone(phone)
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.ROLE_PG_OWNER)
                .active(true)
                .shadowUser(false)
                .build();

        User savedOwner = userRepository.save(owner);

        // 4. Create and persist the initial Property linked to the new Owner
        Property property = Property.builder()
                .name(request.getPropertyName().trim())
                .address(request.getAddress().trim())
                .city(request.getCity().trim())
                .state(request.getState().trim())
                .totalFloors(request.getTotalFloors())
                .owner(savedOwner)
                .build();

        Property savedProperty = propertyRepository.save(property);

        // 5. Construct and return summary response
        return PropertyOnboardingResponse.builder()
                .ownerId(savedOwner.getId())
                .ownerName(savedOwner.getName())
                .ownerEmail(savedOwner.getEmail())
                .role(savedOwner.getRole().name())
                .propertyId(savedProperty.getId())
                .propertyName(savedProperty.getName())
                .address(savedProperty.getAddress())
                .city(savedProperty.getCity())
                .state(savedProperty.getState())
                .totalFloors(savedProperty.getTotalFloors())
                .message("PG Owner account and property listed successfully! You can now log in.")
                .build();
    }
}
