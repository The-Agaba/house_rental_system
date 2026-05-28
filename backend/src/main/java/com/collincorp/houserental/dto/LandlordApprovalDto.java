package com.collincorp.houserental.dto;

import java.util.List;

public record LandlordApprovalDto(
        String notes,
        List<PropertyRegistrationDto> properties
) {}
