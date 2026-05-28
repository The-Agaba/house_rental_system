package com.collincorp.houserental.dto;

import java.util.List;

public record QueueStatusResponse(
        long propertyId,
        String propertyTitle,
        int totalInQueue,
        List<ReservationResponse> activeReservations
) {}
