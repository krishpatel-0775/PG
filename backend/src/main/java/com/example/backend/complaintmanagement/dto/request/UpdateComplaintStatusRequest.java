package com.example.backend.complaintmanagement.dto.request;

import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request payload for updating the status and notes of a maintenance ticket.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateComplaintStatusRequest {

    @NotNull(message = "New complaint status is required (OPEN, IN_PROGRESS, RESOLVED)")
    private ComplaintStatus status;

    @Size(max = 255, message = "Resolution remarks cannot exceed 255 characters")
    private String remarks;
}
