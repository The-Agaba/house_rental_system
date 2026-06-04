package com.collincorp.houserental.dto;

import java.time.Instant;

public record PropertyReviewResponse(
        long id,
        long propertyId,
        long tenantId,
        String tenantName,
        long landlordId,
        long bookingId,
        int rating,
        String comment,
        boolean verifiedRentalReview,
        Instant createdAt) {}
