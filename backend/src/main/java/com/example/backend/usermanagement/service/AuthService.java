package com.example.backend.usermanagement.service;

import com.example.backend.usermanagement.dto.request.LoginRequest;
import com.example.backend.usermanagement.dto.request.RegisterRequest;
import com.example.backend.usermanagement.dto.response.AuthResponse;

/**
 * Service interface defining authentication and user registration operations.
 */
public interface AuthService {

    /**
     * Registers a new user account and returns an authentication response with JWT.
     *
     * @param request Registration details payload
     * @return AuthResponse containing token and user profile details
     */
    AuthResponse register(RegisterRequest request);

    /**
     * Authenticates user credentials and generates a JWT token.
     *
     * @param request Login credentials payload
     * @return AuthResponse containing token and user profile details
     */
    AuthResponse login(LoginRequest request);
}
