package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.ReservationStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public record ReservationResponse(
        long id,
        long propertyId,
        String propertyTitle,
        String propertyLocation,
        String landlordFullName,
        String landlordEmail,
        String landlordPhone,
        long tenantId,
        String tenantEmail,
        String tenantFullName,
        int queuePosition,
        ReservationStatus status,
        LocalDate moveInDate,
        int durationMonths,
        BigDecimal estimatedTotalCost,
        Instant confirmationDeadline,
        Instant createdAt,
        Instant confirmedAt,
        Instant updatedAt
) {}
