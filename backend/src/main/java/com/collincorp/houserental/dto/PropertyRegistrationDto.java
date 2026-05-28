package com.collincorp.houserental.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record PropertyRegistrationDto(
        @NotBlank @Size(max = 255) String title,
        @NotBlank @Size(max = 512) String location
) {}
