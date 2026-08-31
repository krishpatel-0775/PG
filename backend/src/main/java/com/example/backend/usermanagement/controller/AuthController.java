package com.example.backend.usermanagement.controller;

import com.example.backend.usermanagement.dto.request.LoginRequest;
import com.example.backend.usermanagement.dto.request.RegisterRequest;
import com.example.backend.usermanagement.dto.response.AuthResponse;
import com.example.backend.usermanagement.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller handling user registration and authentication endpoints.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Endpoint to register a new user in the PG Management system.
     *
     * @param registerRequest Validated registration payload
     * @return ResponseEntity containing AuthResponse and HTTP 201 Created status
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        AuthResponse response = authService.register(registerRequest);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * Endpoint to authenticate an existing user and obtain a JWT token.
     *
     * @param loginRequest Validated login payload
     * @return ResponseEntity containing AuthResponse and HTTP 200 OK status
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        AuthResponse response = authService.login(loginRequest);
        return ResponseEntity.ok(response);
    }
}
