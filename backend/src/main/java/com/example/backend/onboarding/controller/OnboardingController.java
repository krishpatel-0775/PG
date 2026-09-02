package com.example.backend.onboarding.controller;

import com.example.backend.onboarding.dto.request.PropertyOnboardingRequest;
import com.example.backend.onboarding.dto.response.PropertyOnboardingResponse;
import com.example.backend.onboarding.service.OnboardingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Public REST Controller providing the "List Your PG" onboarding flow for new PG Owners.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/public")
public class OnboardingController {

    private final OnboardingService onboardingService;

    public OnboardingController(OnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    /**
     * Public endpoint for prospective PG owners to register their owner account and list their first property.
     *
     * @param request Validated onboarding registration payload
     * @return Created PropertyOnboardingResponse with HTTP 201 status
     */
    @PostMapping("/onboard-pg")
    public ResponseEntity<PropertyOnboardingResponse> onboardPg(
            @Valid @RequestBody PropertyOnboardingRequest request) {
        PropertyOnboardingResponse response = onboardingService.onboardNewPg(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
