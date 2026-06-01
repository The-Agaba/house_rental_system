package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.service.AuthService;
import com.collincorp.houserental.service.EmailVerificationService;
import com.collincorp.houserental.service.LogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService verificationService;
    private final LogService logService;

    public AuthController(AuthService authService, EmailVerificationService verificationService, LogService logService) {
        this.authService = authService;
        this.verificationService = verificationService;
        this.logService = logService;
    }

    // Step 1: Frontend sends complete registration details here. Holds user in staging area.
    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody RegisterRequest request) {
        // Fail early if email is already active in the database
        if (authService.isEmailTaken(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }

        try {
            verificationService.queuePendingRegistration(request);
            return ResponseEntity.ok("Verification code sent successfully to " + request.email() + ". Please verify to complete registration.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send verification email: " + e.getMessage());
        }
    }

    // Step 2: User inputs the 6-digit code. If valid, user account commits to the database.
    @PostMapping("/verify")
    public ResponseEntity<?> verify(@RequestBody VerificationRequest request) {
        boolean isValid = verificationService.verifyCode(request.getEmail(), request.getCode());

        if (!isValid) {
            return ResponseEntity.badRequest().body("Verification failed: Invalid code or email.");
        }

        // Pull out cached registration details from the staging area
        RegisterRequest pendingData = verificationService.getAndClearPendingRegistration(request.getEmail());

        if (pendingData == null) {
            return ResponseEntity.badRequest().body("Registration data expired or not found. Please register again.");
        }

        // Commit to database safely (AuthService handles internal USER_CREATED audit logging)
        UserResponse response = authService.completeRegistration(pendingData);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public TokenResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout() {
        // Retained administrative logging from Code A
        logService.log(LogAction.LOGOUT, "user", null, "User logged out");
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public UserResponse me() {
        return authService.me();
    }

    @PutMapping("/profile")
    public UserResponse updateProfile(@Valid @RequestBody ProfileUpdateRequest request) {
        return authService.updateProfile(request);
    }

    @PostMapping("/resend-verification-code")
    public ResponseEntity<String> resendVerificationCode(@RequestParam String email) {
        try {
            verificationService.resendVerificationCode(email);
            return ResponseEntity.ok("Verification code sent successfully to " + email);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to send verification email: " + e.getMessage());
        }
    }
}