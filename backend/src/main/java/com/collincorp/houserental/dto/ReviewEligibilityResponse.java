package com.collincorp.houserental.dto;

public record ReviewEligibilityResponse(
        boolean eligible,
        boolean alreadyReviewed,
        Long bookingId,
        String reason) {}
