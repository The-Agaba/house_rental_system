package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LandlordRequestStatus;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.NotificationType;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.entity.LandlordDocumentEntity;
import com.collincorp.houserental.entity.LandlordRequestEntity;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.LandlordDocumentRepository;
import com.collincorp.houserental.repository.LandlordRequestRepository;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class LandlordOnboardingService {

    private final LandlordRequestRepository landlordRequestRepository;
    private final LandlordDocumentRepository landlordDocumentRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final EmailVerificationService emailVerificationService;
    private final NotificationService notificationService;
    private final StorageService storageService;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    public LandlordOnboardingService(
            LandlordRequestRepository landlordRequestRepository,
            LandlordDocumentRepository landlordDocumentRepository,
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            EmailVerificationService emailVerificationService,
            NotificationService notificationService,
            StorageService storageService,
            PasswordEncoder passwordEncoder,
            LogService logService) {
        this.landlordRequestRepository = landlordRequestRepository;
        this.landlordDocumentRepository = landlordDocumentRepository;
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.emailVerificationService = emailVerificationService;
        this.notificationService = notificationService;
        this.storageService = storageService;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
    }

    @Transactional
    public LandlordRequestResponse submitJoinRequest(LandlordJoinRequestDto dto) {
        String email = dto.requesterEmail().trim().toLowerCase();
        
        // 1. Check if email is already taken in the main users table
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }

        // 2. Check if there is already a pending request for this email
        landlordRequestRepository.findByRequesterEmailIgnoreCase(email).ifPresent(req -> {
            if (req.getStatus() == LandlordRequestStatus.pending || 
                req.getStatus() == LandlordRequestStatus.assigned ||
                req.getStatus() == LandlordRequestStatus.verified) {
                throw new ApiException(HttpStatus.CONFLICT, "pending_request_exists");
            }
        });

        // 3. Create LandlordRequestEntity
        LandlordRequestEntity entity = new LandlordRequestEntity();
        entity.setRequesterEmail(email);
        entity.setRequesterFullName(dto.requesterFullName());
        entity.setRequesterPhone(dto.requesterPhone());
        entity.setLocality(dto.locality());
        entity.setTinNumber(dto.tinNumber());
        entity.setStatus(LandlordRequestStatus.pending);

        // Serialize properties to notes initially as history
        if (dto.properties() != null && !dto.properties().isEmpty()) {
            String propListStr = dto.properties().stream()
                    .map(p -> p.title() + " at " + p.location())
                    .collect(Collectors.joining("; "));
            entity.setNotes("Proposed properties: " + propListStr);
        }

        // 4. Find agents in locality to auto-assign
        List<UserEntity> agents = userRepository.findByRoleAndLocality(UserRole.agent, dto.locality());
        if (!agents.isEmpty()) {
            entity.setAssignedAgent(agents.get(0));
            entity.setStatus(LandlordRequestStatus.assigned);
        }

        landlordRequestRepository.save(entity);
        logService.log(LogAction.LANDLORD_REQUEST_CREATED, "landlord_request", entity.getId(), null, email, "Landlord request submitted");

        if (entity.getAssignedAgent() != null) {
            logService.log(LogAction.LANDLORD_REQUEST_ASSIGNED, "landlord_request", entity.getId(), entity.getAssignedAgent().getId(), email, "Auto-assigned agent " + entity.getAssignedAgent().getEmail());
            notificationService.sendNotification(
                    entity.getAssignedAgent().getId(),
                    NotificationType.LANDLORD_REQUEST_UPDATE,
                    "New Landlord Request Assigned",
                    "A new landlord request from " + entity.getRequesterFullName() + " has been assigned to you in your locality (" + entity.getLocality() + ").",
                    entity.getId()
            );
        }

        return toResponse(entity);
    }

    @Transactional
    public LandlordRequestResponse assignAgent(Long requestId, Long agentId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        UserEntity agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "agent_not_found"));

        if (agent.getRole() != UserRole.agent) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "user_is_not_agent");
        }

        request.setAssignedAgent(agent);
        request.setStatus(LandlordRequestStatus.assigned);
        landlordRequestRepository.save(request);

        logService.log(LogAction.LANDLORD_REQUEST_ASSIGNED, "landlord_request", request.getId(), agent.getId(), request.getRequesterEmail(), "Agent assigned manually by admin");

        notificationService.sendNotification(
                agent.getId(),
                NotificationType.LANDLORD_REQUEST_UPDATE,
                "Landlord Request Assigned",
                "A landlord request from " + request.getRequesterFullName() + " has been assigned to you.",
                request.getId()
        );

        return toResponse(request);
    }

    @Transactional
    public LandlordRequestResponse uploadDocument(Long requestId, String documentType, MultipartFile file, Long agentId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        UserEntity agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "agent_not_found"));

        // Store file and get path
        String filePath = storageService.store(file);

        LandlordDocumentEntity doc = new LandlordDocumentEntity();
        doc.setLandlordRequest(request);
        doc.setDocumentType(documentType);
        doc.setFilePath(filePath);
        doc.setUploadedBy(agent);
        doc.setUploadedAt(Instant.now());
        landlordDocumentRepository.save(doc);

        // Update request status to verified once documents start being uploaded
        request.setStatus(LandlordRequestStatus.verified);
        landlordRequestRepository.save(request);

        logService.log(LogAction.DOCUMENT_UPLOADED, "landlord_request", request.getId(), agent.getId(), request.getRequesterEmail(), "Document uploaded: " + documentType);

        return toResponse(request);
    }

    @Transactional
    public LandlordRequestResponse approveLandlord(Long requestId, LandlordApprovalDto dto, Long agentId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        UserEntity agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "agent_not_found"));

        if (userRepository.existsByEmailIgnoreCase(request.getRequesterEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }

        List<LandlordDocumentEntity> documents = landlordDocumentRepository.findByLandlordRequestId(request.getId());
        boolean hasOwnershipDocument = documents.stream()
                .anyMatch(doc -> "OWNERSHIP".equalsIgnoreCase(doc.getDocumentType()));
        boolean hasTinDocument = documents.stream()
                .anyMatch(doc -> "TIN".equalsIgnoreCase(doc.getDocumentType()));
        if (!hasOwnershipDocument || !hasTinDocument) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "missing_required_documents");
        }

        // 1. Create Landlord UserEntity
        UserEntity landlord = new UserEntity();
        landlord.setEmail(request.getRequesterEmail());
        landlord.setFullName(request.getRequesterFullName());
        landlord.setPhone(request.getRequesterPhone());
        landlord.setRole(UserRole.landlord);
        landlord.setTinNumber(request.getTinNumber());
        landlord.setActive(true);
        landlord.setEmailVerified(false); // Verification required via OTP

        // Generate temporary password and hash it
        String tempPassword = "Lnd_" + UUID.randomUUID().toString().substring(0, 8);
        landlord.setPasswordHash(passwordEncoder.encode(tempPassword));
        landlord.setCreatedBy(agent.getId());
        userRepository.save(landlord);

        // 2. Register Skeletal Properties
        List<PropertyRegistrationDto> propsToRegister = dto.properties();
        if (propsToRegister == null) {
            propsToRegister = new ArrayList<>();
        }

        for (PropertyRegistrationDto pDto : propsToRegister) {
            PropertyEntity prop = new PropertyEntity();
            prop.setLandlord(landlord);
            prop.setTitle(pDto.title());
            prop.setLocation(pDto.location());
            prop.setPricePerMonth(BigDecimal.ZERO); // skeletal properties have price = 0
            prop.setRooms(0);
            prop.setNeedsImages(true);
            prop.setRegisteredByAgent(agent);
            prop.setApproved(true); // Agent approves immediately on registration
            prop.setPhone(request.getRequesterPhone());
            prop.setContactEmail(request.getRequesterEmail());
            propertyRepository.save(prop);
            
            logService.log(LogAction.PROPERTY_CREATED, "property", prop.getId(), agent.getId(), request.getRequesterEmail(), "Skeletal property registered by agent: " + prop.getTitle());
        }

        // 3. Update Request Status
        request.setStatus(LandlordRequestStatus.approved);
        request.setCreatedLandlord(landlord);
        if (dto.notes() != null) {
            request.setNotes(dto.notes());
        }
        landlordRequestRepository.save(request);

        logService.log(LogAction.LANDLORD_APPROVED, "landlord_request", request.getId(), agent.getId(), request.getRequesterEmail(), "Landlord request approved by agent");

        // 4. Generate OTP and send the account activation message through the persisted notification pipeline.
        String verificationCode = emailVerificationService.generateLandlordVerificationCode(landlord.getEmail());

        notificationService.sendNotification(
                landlord.getId(),
                NotificationType.LANDLORD_REQUEST_UPDATE,
                "Welcome to RentHub! Account Approved",
                "Your landlord request has been approved.\n\n" +
                "Your activation code is: " + verificationCode + "\n" +
                "Your temporary password is: " + tempPassword + "\n\n" +
                "Open the landlord verification page, verify your email, and choose a new password before logging in.",
                request.getId()
        );

        return toResponse(request);
    }

    @Transactional
    public LandlordRequestResponse rejectRequest(Long requestId, String reason, Long agentId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        request.setStatus(LandlordRequestStatus.rejected);
        request.setNotes(reason);
        landlordRequestRepository.save(request);

        logService.log(LogAction.LANDLORD_REQUEST_CREATED, "landlord_request", request.getId(), agentId, request.getRequesterEmail(), "Request rejected. Reason: " + reason);

        // Simple notification/email could be sent to request.getRequesterEmail(), but since they are not a user in DB, we can write an audit log or try sending a direct email if desired
        return toResponse(request);
    }

    @Transactional
    public void verifyLandlordEmail(String email, String code) {
        boolean valid = emailVerificationService.verifyLandlordCode(email, code);
        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_otp");
        }

        UserEntity landlord = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));

        landlord.setEmailVerified(true);
        userRepository.save(landlord);

        logService.log(LogAction.USER_UPDATED, "user", landlord.getId(), landlord.getId(), landlord.getEmail(), "Landlord email verified successfully");
    }

    @Transactional
    public void verifyAndActivateLandlord(String email, String code, String newPassword) {
        boolean valid = emailVerificationService.verifyLandlordCode(email, code);
        if (!valid) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "invalid_otp");
        }

        UserEntity landlord = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));

        landlord.setEmailVerified(true);
        landlord.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(landlord);

        logService.log(LogAction.USER_UPDATED, "user", landlord.getId(), landlord.getId(), landlord.getEmail(), "Landlord email verified and password set successfully");
    }

    @Transactional(readOnly = true)
    public LandlordRequestResponse getRequest(Long id) {
        LandlordRequestEntity entity = landlordRequestRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));
        return toResponse(entity);
    }

    @Transactional(readOnly = true)
    public List<LandlordRequestResponse> getRequestsAssignedToMe(Long agentId) {
        return landlordRequestRepository.findByAssignedAgentId(agentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LandlordRequestResponse> getAllRequests() {
        return landlordRequestRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public LandlordRequestResponse toResponse(LandlordRequestEntity entity) {
        List<LandlordDocumentResponse> docs = landlordDocumentRepository.findByLandlordRequestId(entity.getId())
                .stream()
                .map(d -> new LandlordDocumentResponse(
                        d.getId(),
                        d.getLandlordRequest().getId(),
                        d.getDocumentType(),
                        d.getFilePath(),
                        d.getUploadedBy() != null ? d.getUploadedBy().getId() : null,
                        d.getUploadedAt()
                ))
                .collect(Collectors.toList());

        return new LandlordRequestResponse(
                entity.getId(),
                entity.getRequesterEmail(),
                entity.getRequesterFullName(),
                entity.getRequesterPhone(),
                entity.getLocality(),
                entity.getTinNumber(),
                entity.getStatus(),
                entity.getAssignedAgent() != null ? entity.getAssignedAgent().getId() : null,
                entity.getAssignedAgent() != null ? entity.getAssignedAgent().getFullName() : null,
                entity.getCreatedLandlord() != null ? entity.getCreatedLandlord().getId() : null,
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                docs
        );
    }
}
