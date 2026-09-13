package com.example.backend.communication;

import com.example.backend.communication.dto.response.NotificationResponse;
import com.example.backend.communication.repository.NotificationRepository;
import com.example.backend.communication.service.EmailTemplateHelper;
import com.example.backend.communication.service.NotificationSseService;
import com.example.backend.communication.service.impl.NotificationServiceImpl;
import com.example.backend.usermanagement.entity.User;
import com.example.backend.usermanagement.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ApplicationEventPublisher eventPublisher;

    @Mock
    private EmailTemplateHelper emailTemplateHelper;

    @InjectMocks
    private NotificationServiceImpl notificationService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(101L)
                .name("Test Tenant")
                .email("tenant@test.com")
                .build();
    }

    @Test
    @DisplayName("test serialization of isRead field in NotificationResponse")
    void testJacksonSerialization() throws Exception {
        com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
        NotificationResponse resp = NotificationResponse.builder()
                .id(1L)
                .isRead(true)
                .build();
        String json = mapper.writeValueAsString(resp);
        System.out.println("SERIALIZED JSON: " + json);
        assertTrue(json.contains("\"isRead\":true"), "JSON should contain 'isRead' key, but got: " + json);
    }

    @Test
    @DisplayName("deleteNotification should invoke repository delete with recipient id")
    void testDeleteNotification() {
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(testUser));

        notificationService.deleteNotification(55L, "tenant@test.com");

        verify(notificationRepository, times(1)).deleteByIdAndRecipientId(55L, 101L);
    }

    @Test
    @DisplayName("markSelectedAsRead should update multiple notifications for recipient")
    void testMarkSelectedAsRead() {
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(testUser));

        notificationService.markSelectedAsRead(java.util.List.of(10L, 20L), "tenant@test.com");

        verify(notificationRepository, times(1)).markSelectedAsReadByIds(java.util.List.of(10L, 20L), 101L);
    }

    @Test
    @DisplayName("deleteSelected should delete multiple notifications for recipient")
    void testDeleteSelected() {
        when(userRepository.findByEmail("tenant@test.com")).thenReturn(Optional.of(testUser));

        notificationService.deleteSelected(java.util.List.of(10L, 20L), "tenant@test.com");

        verify(notificationRepository, times(1)).deleteSelectedByIds(java.util.List.of(10L, 20L), 101L);
    }

    @Test
    @DisplayName("NotificationSseService should subscribe user and broadcast notification event")
    void testSseSubscribeAndBroadcast() {
        NotificationSseService sseService = new NotificationSseService();

        SseEmitter emitter = sseService.subscribe("tenant@test.com");
        assertNotNull(emitter);

        NotificationResponse response = NotificationResponse.builder()
                .id(1L)
                .title("Rent Received")
                .message("₹8000 paid")
                .type("PAYMENT_RECEIPT")
                .build();

        // Broadcast to existing user
        assertDoesNotThrow(() -> sseService.broadcastNotification("tenant@test.com", response));

        // Heartbeat should execute smoothly without throwing exceptions
        assertDoesNotThrow(sseService::sendHeartbeat);
    }
}
