package com.collincorp.houserental.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;

public record LandlordJoinRequestDto(
        @NotBlank @Email @Size(max = 255) String requesterEmail,
        @NotBlank @Size(max = 255) String requesterFullName,
        @NotBlank @Size(max = 20) String requesterPhone,
        @NotBlank @Size(max = 255) String locality,
        @NotBlank @Size(max = 50) String tinNumber,
        List<PropertyRegistrationDto> properties
) {}
