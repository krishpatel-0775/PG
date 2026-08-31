package com.example.backend.complaintmanagement.service;

import com.example.backend.complaintmanagement.dto.request.CreateComplaintRequest;
import com.example.backend.complaintmanagement.dto.request.UpdateComplaintStatusRequest;
import com.example.backend.complaintmanagement.dto.response.ComplaintResponse;

import java.util.List;

/**
 * Service interface managing tenant maintenance requests and resolution lifecycles.
 */
public interface ComplaintService {

    /**
     * Submits a new maintenance ticket on behalf of the authenticated tenant.
     * Automatically infers the property from the tenant's active bed allocation.
     *
     * @param request Validated complaint payload
     * @param tenantEmail Email of the authenticated tenant
     * @return ComplaintResponse DTO
     */
    ComplaintResponse raiseComplaint(CreateComplaintRequest request, String tenantEmail);

    /**
     * Updates the status and optional resolution remarks for an existing complaint ticket.
     *
     * @param complaintId Complaint ID
     * @param request Status update request
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @param isStaff True if user has STAFF role
     * @return ComplaintResponse DTO
     */
    ComplaintResponse updateComplaintStatus(Long complaintId, UpdateComplaintStatusRequest request, String userEmail, boolean isSuperAdmin, boolean isStaff);

    /**
     * Retrieves all complaints submitted by the authenticated tenant.
     *
     * @param tenantEmail Email of the authenticated tenant
     * @return List of ComplaintResponse DTOs
     */
    List<ComplaintResponse> getMyComplaints(String tenantEmail);

    /**
     * Retrieves all complaints for a specific property.
     *
     * @param propertyId Property ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @param isStaff True if user has STAFF role
     * @return List of ComplaintResponse DTOs
     */
    List<ComplaintResponse> getPropertyComplaints(Long propertyId, String userEmail, boolean isSuperAdmin, boolean isStaff);

    /**
     * Retrieves all complaints across properties owned by the authenticated owner.
     *
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if user has SUPER_ADMIN role
     * @return List of ComplaintResponse DTOs
     */
    List<ComplaintResponse> getOwnerComplaints(String userEmail, boolean isSuperAdmin);
}
