package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.UserRole;

public record AdminUserPatchRequest(Boolean active, UserRole role, String locality, String phone) {}
