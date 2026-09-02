package com.example.backend.onboarding.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Summary response returned after successful PG Owner & Property onboarding.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PropertyOnboardingResponse {

    private Long ownerId;
    private String ownerName;
    private String ownerEmail;
    private String role;

    private Long propertyId;
    private String propertyName;
    private String address;
    private String city;
    private String state;
    private Integer totalFloors;

    private String message;
}
