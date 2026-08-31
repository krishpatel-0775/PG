package com.example.backend.communication.controller;

import com.example.backend.communication.dto.request.CreateNoticeRequest;
import com.example.backend.communication.dto.response.NoticeResponse;
import com.example.backend.communication.service.NoticeService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller providing notice board broadcasts, retrieval, and deletion endpoints.
 */
@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/notices")
public class NoticeController {

    private final NoticeService noticeService;

    public NoticeController(NoticeService noticeService) {
        this.noticeService = noticeService;
    }

    /**
     * POST /api/notices/property/{propertyId}: Broadcast a new notice for a property.
     */
    @PostMapping("/property/{propertyId}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<NoticeResponse> createNotice(
            @PathVariable Long propertyId,
            @Valid @RequestBody CreateNoticeRequest request,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        NoticeResponse response = noticeService.createNotice(request, propertyId, userEmail, isSuperAdmin);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * GET /api/notices/property/{propertyId}: Retrieve all notices for a property (Owner or Tenant).
     */
    @GetMapping("/property/{propertyId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<NoticeResponse>> getNoticesByProperty(
            @PathVariable Long propertyId) {
        List<NoticeResponse> notices = noticeService.getNoticesByProperty(propertyId);
        return ResponseEntity.ok(notices);
    }

    /**
     * DELETE /api/notices/{id}: Delete an outdated notice.
     */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('PG_OWNER', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteNotice(
            @PathVariable Long id,
            Authentication authentication) {
        String userEmail = authentication.getName();
        boolean isSuperAdmin = isSuperAdmin(authentication);
        noticeService.deleteNotice(id, userEmail, isSuperAdmin);
        return ResponseEntity.noContent().build();
    }

    private boolean isSuperAdmin(Authentication authentication) {
        if (authentication == null) return false;
        return authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"));
    }
}
