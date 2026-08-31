package com.example.backend.complaintmanagement.dto.request;

import com.example.backend.complaintmanagement.entity.ComplaintCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for submitting a maintenance or service complaint.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateComplaintRequest {

    @NotNull(message = "Complaint category is required (ELECTRICAL, PLUMBING, CLEANING, INTERNET, OTHER)")
    private ComplaintCategory category;

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "Description is required")
    @Size(max = 1000, message = "Description cannot exceed 1000 characters")
    private String description;

    private Long propertyId;
}
