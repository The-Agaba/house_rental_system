package com.collincorp.houserental.dto;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public record ReservationCreateRequest(
        @NotNull Long propertyId,
        @NotNull @FutureOrPresent LocalDate moveInDate,
        @NotNull @Min(1) Integer durationMonths
) {}
