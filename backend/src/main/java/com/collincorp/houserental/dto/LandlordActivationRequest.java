package com.collincorp.houserental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LandlordActivationRequest(
        @NotBlank String email,
        @NotBlank @Size(min = 6, max = 6) String code,
        @NotBlank @Size(min = 6) String newPassword
) {}
