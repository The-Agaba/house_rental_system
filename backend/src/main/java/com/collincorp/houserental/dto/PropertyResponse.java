package com.collincorp.houserental.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PropertyResponse(
        long id,
        long landlordId,
        String landlordEmail,
        String title,
        String description,
        String location,
        BigDecimal pricePerMonth,
        int rooms,
        String availability,
        boolean approved,
        Instant createdAt,
        List<PropertyImageResponse> images,
        String phone,
        String contactEmail,
        long bookingCount,
        BigDecimal averageRating,
        long reviewCount,
        boolean needsImages,
        Long registeredByAgentId) {}
