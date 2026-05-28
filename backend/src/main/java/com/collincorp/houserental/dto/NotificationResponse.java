package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.NotificationType;
import java.time.Instant;

public record NotificationResponse(
        long id,
        long recipientId,
        NotificationType type,
        String title,
        String message,
        boolean read,
        boolean emailSent,
        Long referenceId,
        Instant createdAt
) {}
