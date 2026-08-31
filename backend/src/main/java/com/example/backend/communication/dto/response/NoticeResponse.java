package com.example.backend.communication.dto.response;

import com.example.backend.communication.entity.Notice;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Response payload representing a published property announcement.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NoticeResponse {

    private Long id;
    private Long propertyId;
    private String propertyName;
    private String title;
    private String content;
    private LocalDateTime createdAt;
    private String createdBy;

    public static NoticeResponse fromEntity(Notice notice, String propertyName) {
        if (notice == null) return null;
        return NoticeResponse.builder()
                .id(notice.getId())
                .propertyId(notice.getPropertyId())
                .propertyName(propertyName)
                .title(notice.getTitle())
                .content(notice.getContent())
                .createdAt(notice.getCreatedAt())
                .createdBy(notice.getCreatedBy())
                .build();
    }
}
