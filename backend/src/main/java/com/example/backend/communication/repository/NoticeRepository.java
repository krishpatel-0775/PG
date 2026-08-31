package com.example.backend.communication.repository;

import com.example.backend.communication.entity.Notice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Spring Data JPA Repository for {@link Notice} entity.
 */
@Repository
public interface NoticeRepository extends JpaRepository<Notice, Long> {

    List<Notice> findByPropertyIdOrderByCreatedAtDesc(Long propertyId);
}
