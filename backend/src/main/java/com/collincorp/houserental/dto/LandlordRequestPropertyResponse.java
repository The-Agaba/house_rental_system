package com.collincorp.houserental.dto;

public record LandlordRequestPropertyResponse(
        long id,
        String title,
        String location,
        boolean approved,
        Long createdPropertyId
) {}
