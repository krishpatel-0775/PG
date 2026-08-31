package com.example.backend.complaintmanagement.service.impl;

import com.example.backend.complaintmanagement.dto.request.CreateComplaintRequest;
import com.example.backend.complaintmanagement.dto.request.UpdateComplaintStatusRequest;
import com.example.backend.complaintmanagement.dto.response.ComplaintResponse;
import com.example.backend.complaintmanagement.entity.Complaint;
import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import com.example.backend.complaintmanagement.repository.ComplaintRepository;
import com.example.backend.complaintmanagement.service.ComplaintService;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.tenantmanagement.entity.Allocation;
import com.example.backend.tenantmanagement.entity.AllocationStatus;
import com.example.backend.tenantmanagement.repository.AllocationRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Implementation of {@link ComplaintService} managing tenant complaint submissions,
 * staff resolution lifecycles, and role-based ticket views.
 */
@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final AllocationRepository allocationRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public ComplaintServiceImpl(ComplaintRepository complaintRepository,
                                AllocationRepository allocationRepository,
                                PropertyRepository propertyRepository,
                                UserRepository userRepository) {
        this.complaintRepository = complaintRepository;
        this.allocationRepository = allocationRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    /**
     * Submits a complaint on behalf of the logged-in tenant.
     * Automatically extracts the linked Property from the tenant's active stay.
     */
    @Override
    public ComplaintResponse raiseComplaint(CreateComplaintRequest request, String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant profile not found: " + tenantEmail));

        // Infer property from active allocation or provided ID
        Property property = null;
        Optional<Allocation> allocationOpt = allocationRepository.findFirstByTenantIdAndStatus(tenant.getId(), AllocationStatus.ACTIVE);

        if (allocationOpt.isPresent()) {
            property = allocationOpt.get().getBed().getRoom().getProperty();
        } else if (request.getPropertyId() != null) {
            property = propertyRepository.findById(request.getPropertyId())
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + request.getPropertyId()));
        } else {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "No active room allocation found. Please specify a valid Property ID to file a maintenance ticket."
            );
        }

        Complaint complaint = Complaint.builder()
                .tenant(tenant)
                .property(property)
                .category(request.getCategory())
                .title(request.getTitle().trim())
                .description(request.getDescription().trim())
                .status(ComplaintStatus.OPEN)
                .createdAt(LocalDateTime.now())
                .resolvedAt(null)
                .remarks(null)
                .build();

        Complaint savedComplaint = complaintRepository.save(complaint);

        return ComplaintResponse.fromEntity(savedComplaint);
    }

    /**
     * Updates the ticket status and resolution timestamp.
     */
    @Override
    public ComplaintResponse updateComplaintStatus(Long complaintId,
                                                   UpdateComplaintStatusRequest request,
                                                   String userEmail,
                                                   boolean isSuperAdmin,
                                                   boolean isStaff) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Complaint not found with ID: " + complaintId));

        // Verify authorization
        if (!isSuperAdmin && !isStaff) {
            var propertyOwner = complaint.getProperty().getOwner();
            if (!propertyOwner.getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to update tickets for this property.");
            }
        }

        complaint.setStatus(request.getStatus());

        if (request.getStatus() == ComplaintStatus.RESOLVED) {
            complaint.setResolvedAt(LocalDateTime.now());
        } else {
            complaint.setResolvedAt(null);
        }

        if (request.getRemarks() != null && !request.getRemarks().trim().isEmpty()) {
            complaint.setRemarks(request.getRemarks().trim());
        }

        Complaint updatedComplaint = complaintRepository.save(complaint);

        return ComplaintResponse.fromEntity(updatedComplaint);
    }

    /**
     * Retrieves all complaints submitted by the tenant.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints(String tenantEmail) {
        User tenant = userRepository.findByEmail(tenantEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant profile not found: " + tenantEmail));

        List<Complaint> complaints = complaintRepository.findByTenantIdOrderByCreatedAtDesc(tenant.getId());

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves complaints for a specific property.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getPropertyComplaints(Long propertyId,
                                                         String userEmail,
                                                         boolean isSuperAdmin,
                                                         boolean isStaff) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!isSuperAdmin && !isStaff) {
            if (!property.getOwner().getId().equals(caller.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to view tickets for this property.");
            }
        }

        List<Complaint> complaints = complaintRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId);

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Retrieves all complaints for properties owned by the caller.
     */
    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getOwnerComplaints(String userEmail, boolean isSuperAdmin) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        List<Complaint> complaints = isSuperAdmin
                ? complaintRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : complaintRepository.findByPropertyOwnerIdOrderByCreatedAtDesc(user.getId());

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }
}
