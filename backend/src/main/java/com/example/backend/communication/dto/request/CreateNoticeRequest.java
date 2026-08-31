package com.example.backend.communication.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for creating and publishing a new notice.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateNoticeRequest {

    @NotBlank(message = "Notice title is required")
    @Size(max = 150, message = "Notice title cannot exceed 150 characters")
    private String title;

    @NotBlank(message = "Notice content is required")
    private String content;

    private Long propertyId;
}
