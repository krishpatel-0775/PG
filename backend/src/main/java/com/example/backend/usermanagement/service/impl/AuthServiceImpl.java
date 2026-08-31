package com.example.backend.usermanagement.service.impl;

import com.example.backend.security.CustomUserDetails;
import com.example.backend.security.jwt.JwtUtils;
import com.example.backend.usermanagement.dto.request.LoginRequest;
import com.example.backend.usermanagement.dto.request.RegisterRequest;
import com.example.backend.usermanagement.dto.response.AuthResponse;
import com.example.backend.usermanagement.entity.Role;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import com.example.backend.usermanagement.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

/**
 * Implementation of {@link AuthService} managing user registration, validation,
 * credential hashing, and JWT token issuance.
 */
@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtils jwtUtils;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           AuthenticationManager authenticationManager,
                           JwtUtils jwtUtils) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtUtils = jwtUtils;
    }

    /**
     * Registers a new user, hashes the password, saves to database, and authenticates
     * the new user to issue a JWT token.
     *
     * @param request Validated registration payload
     * @return AuthResponse containing token and user profile details
     */
    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone() != null && !request.getPhone().trim().isEmpty()
                ? request.getPhone().trim()
                : null;

        User userToSave;

        // 1. Check if user exists by Phone
        Optional<User> userByPhone = phone != null ? userRepository.findByPhone(phone) : Optional.empty();

        if (userByPhone.isPresent()) {
            User existingUser = userByPhone.get();
            if (existingUser.isShadowUser()) {
                // Check if new email is already taken by another account
                if (!existingUser.getEmail().equalsIgnoreCase(email)) {
                    Optional<User> userByNewEmail = userRepository.findByEmail(email);
                    if (userByNewEmail.isPresent() && !userByNewEmail.get().getId().equals(existingUser.getId())) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Error: Email is already in use by another account: " + email);
                    }
                }

                // Activate shadow user with credentials and registration details
                existingUser.setName(request.getName().trim());
                existingUser.setEmail(email);
                existingUser.setPhone(phone);
                existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                existingUser.setShadowUser(false);
                existingUser.setActive(true);
                if (request.getRole() != null) {
                    existingUser.setRole(request.getRole());
                }
                userToSave = existingUser;
            } else {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Error: Phone number is already registered: " + phone);
            }
        } else {
            // 2. Check if user exists by Email
            Optional<User> userByEmail = userRepository.findByEmail(email);
            if (userByEmail.isPresent()) {
                User existingUser = userByEmail.get();
                if (existingUser.isShadowUser()) {
                    existingUser.setName(request.getName().trim());
                    if (phone != null) {
                        existingUser.setPhone(phone);
                    }
                    existingUser.setPassword(passwordEncoder.encode(request.getPassword()));
                    existingUser.setShadowUser(false);
                    existingUser.setActive(true);
                    if (request.getRole() != null) {
                        existingUser.setRole(request.getRole());
                    }
                    userToSave = existingUser;
                } else {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "Error: Email is already in use: " + email);
                }
            } else {
                // 3. Brand new User creation
                Role role = request.getRole() != null ? request.getRole() : Role.ROLE_TENANT;

                userToSave = User.builder()
                        .name(request.getName().trim())
                        .email(email)
                        .phone(phone)
                        .password(passwordEncoder.encode(request.getPassword()))
                        .role(role)
                        .active(true)
                        .shadowUser(false)
                        .build();
            }
        }

        User savedUser = userRepository.save(userToSave);

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        email,
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(savedUser.getId())
                .name(savedUser.getName())
                .email(savedUser.getEmail())
                .role(savedUser.getRole().name())
                .build();
    }

    /**
     * Authenticates user credentials via AuthenticationManager and generates a JWT token.
     *
     * @param request Validated login payload
     * @return AuthResponse containing JWT and authenticated user details
     */
    @Override
    public AuthResponse login(LoginRequest request) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getEmail(),
                        request.getPassword()
                )
        );

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);

        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        String role = userDetails.getAuthorities().stream()
                .findFirst()
                .map(GrantedAuthority::getAuthority)
                .orElse(Role.ROLE_TENANT.name());

        return AuthResponse.builder()
                .token(jwt)
                .type("Bearer")
                .id(userDetails.getId())
                .name(userDetails.getName())
                .email(userDetails.getEmail())
                .role(role)
                .build();
    }
}
