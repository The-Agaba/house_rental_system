package com.collincorp.houserental.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;

public record AdditionalPropertyRequestDto(
        @NotEmpty List<@Valid PropertyRegistrationDto> properties
) {}
