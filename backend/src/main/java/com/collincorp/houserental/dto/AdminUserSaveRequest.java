package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record AdminUserSaveRequest(
        @NotBlank @Email String email,
        String password,
        String fullName,
        UserRole role,
        Boolean active,
        String locality,
        String phone
) {}
