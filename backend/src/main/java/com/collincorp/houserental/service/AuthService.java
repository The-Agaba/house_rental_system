package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.UserRepository;
import com.collincorp.houserental.security.JwtService;
import com.collincorp.houserental.support.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final LogService logService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService, LogService logService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public boolean isEmailTaken(String email) {
        return userRepository.existsByEmailIgnoreCase(email);
    }

    // Executed ONLY when OTP verification passes successfully
    @Transactional
    public UserResponse completeRegistration(RegisterRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }

        UserRole role = req.role() != null ? req.role() : UserRole.tenant;
        if (role == UserRole.admin || role == UserRole.landlord || role == UserRole.agent) {
            role = UserRole.tenant;
        }

        UserEntity u = new UserEntity();
        u.setEmail(req.email().trim().toLowerCase());
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setRole(role);
        u.setActive(true); // Explicitly mark active since email is verified via OTP
        u.setEmailVerified(true); // Default users who register via OTP directly are verified

        userRepository.save(u);

        // Retained Audit Logging from Code A
        logService.log(LogAction.USER_CREATED, "user", u.getId(), u.getId(), u.getEmail(), "User registered successfully via OTP");

        return toUser(u);
    }

    @Transactional
    public TokenResponse login(LoginRequest req) {
        String email = req.email().trim().toLowerCase();

        UserEntity u = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (u == null) {
            logService.log(LogAction.LOGIN, "user", null, null, email, "Failed login attempt: user not found");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }
        if (!u.isActive()) {
            logService.log(LogAction.LOGIN, "user", u.getId(), u.getId(), u.getEmail(), "Failed login attempt: account inactive");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }
        if (u.getRole() == UserRole.landlord && !u.isEmailVerified()) {
            logService.log(LogAction.LOGIN, "user", u.getId(), u.getId(), u.getEmail(), "Failed login attempt: landlord email not verified");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "landlord_email_not_verified");
        }
        if (!passwordEncoder.matches(req.password(), u.getPasswordHash())) {
            logService.log(LogAction.LOGIN, "user", u.getId(), u.getId(), u.getEmail(), "Failed login attempt: incorrect password");
            throw new ApiException(HttpStatus.UNAUTHORIZED, "invalid_credentials");
        }

        String token = jwtService.generateToken(u.getId(), u.getEmail(), u.getRole().name());
        logService.log(LogAction.LOGIN, "user", u.getId(), u.getId(), u.getEmail(), "User logged in successfully");

        return TokenResponse.of(token, toUser(u));
    }

    @Transactional(readOnly = true)
    public UserResponse me() {
        return toUser(SecurityUtils.currentUser());
    }

    @Transactional
    public UserResponse updateProfile(ProfileUpdateRequest req) {
        UserEntity u = userRepository.findById(SecurityUtils.currentUser().getId()).orElseThrow();

        if (req.fullName() != null && !req.fullName().isBlank()) {
            u.setFullName(req.fullName());
        }
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }

        userRepository.save(u);
        logService.log(LogAction.USER_UPDATED, "user", u.getId(), u.getId(), u.getEmail(), "User updated profile details");

        return toUser(u);
    }

    private static UserResponse toUser(UserEntity u) {
        // Keeps the comprehensive fields from Code A to match logging requirements
        return new UserResponse(
                u.getId(),
                u.getEmail(),
                u.getFullName(),
                u.getRole().name(),
                u.isActive(),
                u.getCreatedBy(),
                u.getLocality(),
                u.getPhone(),
                u.isEmailVerified(),
                u.getTinNumber()
        );
    }
}