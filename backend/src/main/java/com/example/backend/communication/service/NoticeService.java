package com.example.backend.communication.service;

import com.example.backend.communication.dto.request.CreateNoticeRequest;
import com.example.backend.communication.dto.response.NoticeResponse;

import java.util.List;

/**
 * Service interface managing property announcements and notice broadcasts.
 */
public interface NoticeService {

    /**
     * Creates and publishes a new announcement for a property.
     *
     * @param request Validated notice payload
     * @param propertyId Target property ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if caller is SUPER_ADMIN
     * @return NoticeResponse DTO
     */
    NoticeResponse createNotice(CreateNoticeRequest request, Long propertyId, String userEmail, boolean isSuperAdmin);

    /**
     * Retrieves all active notices for a property, ordered newest first.
     *
     * @param propertyId Property ID
     * @return List of NoticeResponse DTOs
     */
    List<NoticeResponse> getNoticesByProperty(Long propertyId);

    /**
     * Deletes a notice by ID.
     *
     * @param noticeId Notice ID
     * @param userEmail Email of the authenticated caller
     * @param isSuperAdmin True if caller is SUPER_ADMIN
     */
    void deleteNotice(Long noticeId, String userEmail, boolean isSuperAdmin);
}
