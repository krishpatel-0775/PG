package com.example.backend.communication.service.impl;

import com.example.backend.communication.dto.request.CreateNoticeRequest;
import com.example.backend.communication.dto.response.NoticeResponse;
import com.example.backend.communication.entity.Notice;
import com.example.backend.communication.repository.NoticeRepository;
import com.example.backend.communication.service.NoticeService;
import com.example.backend.propertymanagement.entity.Property;
import com.example.backend.propertymanagement.repository.PropertyRepository;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Implementation of {@link NoticeService} handling broadcast notice creation,
 * retrieval, and deletion.
 */
@Service
@Transactional
public class NoticeServiceImpl implements NoticeService {

    private final NoticeRepository noticeRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;

    public NoticeServiceImpl(NoticeRepository noticeRepository,
                             PropertyRepository propertyRepository,
                             UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
    }

    @Override
    public NoticeResponse createNotice(CreateNoticeRequest request, Long propertyId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        if (!isSuperAdmin && !property.getOwner().getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to post notices for this property.");
        }

        String author = caller.getName() != null && !caller.getName().trim().isEmpty()
                ? caller.getName()
                : "PG Management";

        Notice notice = Notice.builder()
                .propertyId(property.getId())
                .title(request.getTitle().trim())
                .content(request.getContent().trim())
                .createdAt(LocalDateTime.now())
                .createdBy(author)
                .build();

        Notice savedNotice = noticeRepository.save(notice);

        return NoticeResponse.fromEntity(savedNotice, property.getName());
    }

    @Override
    @Transactional(readOnly = true)
    public List<NoticeResponse> getNoticesByProperty(Long propertyId) {
        Property property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + propertyId));

        List<Notice> notices = noticeRepository.findByPropertyIdOrderByCreatedAtDesc(propertyId);

        return notices.stream()
                .map(n -> NoticeResponse.fromEntity(n, property.getName()))
                .collect(Collectors.toList());
    }

    @Override
    public void deleteNotice(Long noticeId, String userEmail, boolean isSuperAdmin) {
        User caller = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found: " + userEmail));

        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notice not found with ID: " + noticeId));

        Property property = propertyRepository.findById(notice.getPropertyId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Property not found with ID: " + notice.getPropertyId()));

        if (!isSuperAdmin && !property.getOwner().getId().equals(caller.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not have permission to delete notices for this property.");
        }

        noticeRepository.delete(notice);
    }
}
