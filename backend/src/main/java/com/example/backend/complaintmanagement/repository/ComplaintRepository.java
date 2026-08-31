package com.example.backend.complaintmanagement.repository;

import com.example.backend.complaintmanagement.entity.Complaint;
import com.example.backend.complaintmanagement.entity.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Complaint} entity.
 */
@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    List<Complaint> findByPropertyId(Long propertyId);

    List<Complaint> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);

    List<Complaint> findByTenantId(Long tenantId);

    List<Complaint> findByTenantIdOrderByCreatedAtDesc(Long tenantId);

    List<Complaint> findByStatus(ComplaintStatus status);

    List<Complaint> findByPropertyOwnerIdOrderByCreatedAtDesc(Long ownerId);

    List<Complaint> findByPropertyIdAndStatus(Long propertyId, ComplaintStatus status);
}
