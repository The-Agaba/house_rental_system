package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.ReservationStatus;
import java.time.Instant;
import java.util.List;

public record QueueStatusResponse(
        long propertyId,
        String propertyTitle,
        int totalInQueue,
        List<ReservationResponse> activeReservations,
        boolean reserved,
        ReservationStatus status,
        Instant reservationExpiresAt,
        boolean appointmentConfirmed
) {}
