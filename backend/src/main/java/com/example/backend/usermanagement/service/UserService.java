package com.example.backend.usermanagement.service;

import com.example.backend.usermanagement.dto.request.ChangePasswordRequest;
import com.example.backend.usermanagement.dto.request.UpdateProfileRequest;
import com.example.backend.usermanagement.dto.response.UserProfileResponse;

/**
 * Service contract for user profile inspection, profile updates, and password changes.
 */
public interface UserService {

    UserProfileResponse getCurrentUserProfile(String email);

    UserProfileResponse updateProfile(String email, UpdateProfileRequest request);

    void changePassword(String email, ChangePasswordRequest request);
}
