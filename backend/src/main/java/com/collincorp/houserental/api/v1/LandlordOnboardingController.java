package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.service.LandlordOnboardingService;
import com.collincorp.houserental.support.SecurityUtils;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/landlord-requests")
public class LandlordOnboardingController {

    private final LandlordOnboardingService onboardingService;

    public LandlordOnboardingController(LandlordOnboardingService onboardingService) {
        this.onboardingService = onboardingService;
    }

    @PostMapping
    public ResponseEntity<LandlordRequestResponse> submitJoinRequest(@Valid @RequestBody LandlordJoinRequestDto dto) {
        return ResponseEntity.ok(onboardingService.submitJoinRequest(dto));
    }

    @PostMapping("/verify")
    public ResponseEntity<String> verifyLandlordEmail(@RequestBody VerificationRequest request) {
        onboardingService.verifyLandlordEmail(request.getEmail(), request.getCode());
        return ResponseEntity.ok("Landlord email verified successfully. You can now log in.");
    }

    @PostMapping("/verify-and-activate")
    public ResponseEntity<String> verifyAndActivateLandlord(@Valid @RequestBody LandlordActivationRequest request) {
        onboardingService.verifyAndActivateLandlord(request.email(), request.code(), request.newPassword());
        return ResponseEntity.ok("Landlord email verified and password activated successfully.");
    }

    @GetMapping("/my")
    public ResponseEntity<List<LandlordRequestResponse>> getMyAssignedRequests() {
        UserEntity agent = SecurityUtils.currentUser();
        return ResponseEntity.ok(onboardingService.getRequestsAssignedToMe(agent.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LandlordRequestResponse> getRequestDetails(@PathVariable Long id) {
        return ResponseEntity.ok(onboardingService.getRequest(id));
    }

    @PutMapping("/{id}/assign")
    public ResponseEntity<LandlordRequestResponse> assignAgent(@PathVariable Long id, @RequestParam Long agentId) {
        return ResponseEntity.ok(onboardingService.assignAgent(id, agentId));
    }

    @PostMapping("/{id}/documents")
    public ResponseEntity<LandlordRequestResponse> uploadDocument(
            @PathVariable Long id,
            @RequestParam("documentType") String documentType,
            @RequestParam(value = "requestPropertyId", required = false) Long requestPropertyId,
            @RequestParam("file") MultipartFile file) {
        UserEntity agent = SecurityUtils.currentUser();
        return ResponseEntity.ok(onboardingService.uploadDocument(id, documentType, file, agent.getId(), requestPropertyId));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<LandlordRequestResponse> approveRequest(
            @PathVariable Long id,
            @Valid @RequestBody LandlordApprovalDto dto) {
        UserEntity agent = SecurityUtils.currentUser();
        return ResponseEntity.ok(onboardingService.approveLandlord(id, dto, agent.getId()));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<LandlordRequestResponse> rejectRequest(
            @PathVariable Long id,
            @RequestParam String reason) {
        UserEntity agent = SecurityUtils.currentUser();
        return ResponseEntity.ok(onboardingService.rejectRequest(id, reason, agent.getId()));
    }

    @GetMapping
    public ResponseEntity<List<LandlordRequestResponse>> getAllRequests() {
        return ResponseEntity.ok(onboardingService.getAllRequests());
    }
}
