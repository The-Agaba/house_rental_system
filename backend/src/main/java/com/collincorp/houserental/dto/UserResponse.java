package com.collincorp.houserental.dto;

public record UserResponse(
        long id,
        String email,
        String fullName,
        String role,
        boolean active,
        Long createdBy,
        String locality,
        String phone,
        boolean emailVerified,
        String tinNumber) {}
