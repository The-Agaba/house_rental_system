package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.PropertyAvailability;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record PropertyUpdateRequest(
        @Size(max = 255) String title,
        @Size(max = 8000) String description,
        @Size(max = 512) String location,
        @DecimalMin(value = "0.0", message = "Monthly rent cannot be negative")
        BigDecimal pricePerMonth,
        @Min(value = 0, message = "Number of rooms cannot be negative")
        Integer rooms,
        PropertyAvailability availability,
        @Size(max = 20) String phone,
        @Email @Size(max = 255) String contactEmail) {}
