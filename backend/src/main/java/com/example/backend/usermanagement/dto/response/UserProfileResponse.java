package com.example.backend.usermanagement.dto.response;

import com.example.backend.usermanagement.entity.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO representing public/profile details of a user for autofill and lookups.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String role;
    private boolean isShadowUser;
    private boolean active;

    /**
     * Factory method mapping User entity to UserProfileResponse DTO.
     */
    public static UserProfileResponse fromEntity(User user) {
        if (user == null) return null;
        return UserProfileResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .isShadowUser(user.isShadowUser())
                .active(user.isActive())
                .build();
    }
}
