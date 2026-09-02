package com.example.backend.onboarding.service;

import com.example.backend.onboarding.dto.request.PropertyOnboardingRequest;
import com.example.backend.onboarding.dto.response.PropertyOnboardingResponse;

/**
 * Service interface for handling simultaneous PG Owner registration and initial property onboarding.
 */
public interface OnboardingService {

    /**
     * Atomically registers a new PG Owner account and provisions their first PG Property.
     *
     * @param request Validated onboarding registration payload
     * @return Summary response containing created user ID, property ID, and confirmation message
     */
    PropertyOnboardingResponse onboardNewPg(PropertyOnboardingRequest request);
}
