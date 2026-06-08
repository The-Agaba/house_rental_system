package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LandlordRequestStatus;
import com.collincorp.houserental.domain.LandlordRequestType;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.NotificationType;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.entity.LandlordDocumentEntity;
import com.collincorp.houserental.entity.LandlordRequestEntity;
import com.collincorp.houserental.entity.LandlordRequestPropertyEntity;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.LandlordDocumentRepository;
import com.collincorp.houserental.repository.LandlordRequestRepository;
import com.collincorp.houserental.repository.LandlordRequestPropertyRepository;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Instant;
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
    private final LandlordRequestPropertyRepository landlordRequestPropertyRepository;
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
            LandlordRequestPropertyRepository landlordRequestPropertyRepository,
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            EmailVerificationService emailVerificationService,
            NotificationService notificationService,
            StorageService storageService,
            PasswordEncoder passwordEncoder,
            LogService logService) {
        this.landlordRequestRepository = landlordRequestRepository;
        this.landlordDocumentRepository = landlordDocumentRepository;
        this.landlordRequestPropertyRepository = landlordRequestPropertyRepository;
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

        // 2. Check if there is already an active request for this email.
        boolean hasActiveRequest = landlordRequestRepository.findByRequesterEmailIgnoreCase(email)
                .stream()
                .anyMatch(req -> req.getStatus() == LandlordRequestStatus.pending
                        || req.getStatus() == LandlordRequestStatus.assigned
                        || req.getStatus() == LandlordRequestStatus.verified);
        if (hasActiveRequest) {
            throw new ApiException(HttpStatus.CONFLICT, "pending_request_exists");
        }

        // 3. Create LandlordRequestEntity
        LandlordRequestEntity entity = new LandlordRequestEntity();
        entity.setRequesterEmail(email);
        entity.setRequesterFullName(dto.requesterFullName());
        entity.setRequesterPhone(dto.requesterPhone());
        entity.setLocality(dto.locality());
        entity.setTinNumber(dto.tinNumber());
        entity.setRequestType(LandlordRequestType.initial_landlord);
        entity.setStatus(LandlordRequestStatus.pending);

        // 4. Find agents in locality to auto-assign
        List<UserEntity> agents = userRepository.findByRoleAndLocality(UserRole.agent, dto.locality());
        if (!agents.isEmpty()) {
            entity.setAssignedAgent(agents.get(0));
            entity.setStatus(LandlordRequestStatus.assigned);
        }

        landlordRequestRepository.save(entity);

        emailVerificationService.sendEmailNotification(email, "Visit Your Agent",
                "Please Visit Your Agent At Your Locality " + dto.locality() + " Central office\n" +
                "Please go with Your full Identification Documents\n" +
                "1. Your NIDA card\n" +
                "2. Your TIN number\n" +
                "Our office is open Monday to Sunday from 08:00 up to 18:00");

        List<PropertyRegistrationDto> submittedProperties = dto.properties() == null ? List.of() : dto.properties();
        if (submittedProperties.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_claim_required");
        }
        for (PropertyRegistrationDto pDto : submittedProperties) {
            LandlordRequestPropertyEntity claim = new LandlordRequestPropertyEntity();
            claim.setLandlordRequest(entity);
            claim.setTitle(pDto.title().trim());
            claim.setLocation(pDto.location().trim());
            claim.setApproved(false);
            landlordRequestPropertyRepository.save(claim);
        }

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
    public LandlordRequestResponse submitAdditionalPropertyRequest(AdditionalPropertyRequestDto dto) {
        UserEntity landlord = com.collincorp.houserental.support.SecurityUtils.currentUser();
        if (landlord.getRole() != UserRole.landlord) {
            throw new ApiException(HttpStatus.FORBIDDEN, "landlord_role_required");
        }

        List<PropertyRegistrationDto> submittedProperties = dto.properties() == null ? List.of() : dto.properties();
        if (submittedProperties.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_claim_required");
        }

        boolean hasActivePropertyRequest = landlordRequestRepository.findByRequesterEmailIgnoreCase(landlord.getEmail())
                .stream()
                .anyMatch(req -> req.getRequestType() == LandlordRequestType.additional_property
                        && (req.getStatus() == LandlordRequestStatus.pending
                        || req.getStatus() == LandlordRequestStatus.assigned
                        || req.getStatus() == LandlordRequestStatus.verified));
        if (hasActivePropertyRequest) {
            throw new ApiException(HttpStatus.CONFLICT, "pending_property_request_exists");
        }

        LandlordRequestEntity entity = new LandlordRequestEntity();
        entity.setRequesterEmail(landlord.getEmail().trim().toLowerCase());
        entity.setRequesterFullName(landlord.getFullName() != null ? landlord.getFullName() : landlord.getEmail());
        entity.setRequesterPhone(landlord.getPhone() != null ? landlord.getPhone() : "");
        entity.setLocality(landlord.getLocality() != null ? landlord.getLocality() : "Unassigned");
        entity.setTinNumber(landlord.getTinNumber() != null ? landlord.getTinNumber() : "EXISTING_LANDLORD");
        entity.setRequestType(LandlordRequestType.additional_property);
        entity.setCreatedLandlord(landlord);
        entity.setStatus(LandlordRequestStatus.pending);

        List<UserEntity> agents = userRepository.findByRoleAndLocality(UserRole.agent, entity.getLocality());
        if (!agents.isEmpty()) {
            entity.setAssignedAgent(agents.get(0));
            entity.setStatus(LandlordRequestStatus.assigned);
        }

        landlordRequestRepository.save(entity);

        for (PropertyRegistrationDto pDto : submittedProperties) {
            LandlordRequestPropertyEntity claim = new LandlordRequestPropertyEntity();
            claim.setLandlordRequest(entity);
            claim.setTitle(pDto.title().trim());
            claim.setLocation(pDto.location().trim());
            claim.setApproved(false);
            landlordRequestPropertyRepository.save(claim);
        }

        logService.log(LogAction.LANDLORD_REQUEST_CREATED, "landlord_request", entity.getId(), landlord.getId(), landlord.getEmail(), "Additional property request submitted");

        if (entity.getAssignedAgent() != null) {
            notificationService.sendNotification(
                    entity.getAssignedAgent().getId(),
                    NotificationType.LANDLORD_REQUEST_UPDATE,
                    "Additional Property Request Assigned",
                    "A verified landlord submitted a new property request in your locality (" + entity.getLocality() + ").",
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
    public LandlordRequestResponse uploadDocument(Long requestId, String documentType, MultipartFile file, Long agentId, Long requestPropertyId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        UserEntity agent = userRepository.findById(agentId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "agent_not_found"));

        LandlordRequestPropertyEntity requestProperty = null;
        if (requestPropertyId != null) {
            requestProperty = landlordRequestPropertyRepository.findById(requestPropertyId)
                    .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_property_not_found"));
            if (!requestProperty.getLandlordRequest().getId().equals(request.getId())) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "request_property_mismatch");
            }
        }
        if ("NIDA".equalsIgnoreCase(documentType) && requestProperty == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "nida_property_required");
        }

        String filePath = storageService.store(file);

        LandlordDocumentEntity doc = new LandlordDocumentEntity();
        doc.setLandlordRequest(request);
        doc.setDocumentType(documentType);
        doc.setFilePath(filePath);
        doc.setUploadedBy(agent);
        doc.setRequestProperty(requestProperty);
        doc.setUploadedAt(Instant.now());
        landlordDocumentRepository.save(doc);

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

        if (request.getRequestType() == LandlordRequestType.initial_landlord
                && userRepository.existsByEmailIgnoreCase(request.getRequesterEmail())) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }

        List<LandlordDocumentEntity> documents = landlordDocumentRepository.findByLandlordRequestId(request.getId());
        List<LandlordRequestPropertyEntity> claimedProperties = landlordRequestPropertyRepository.findByLandlordRequestIdOrderByIdAsc(request.getId());
        boolean requiresTinDocument = request.getRequestType() == LandlordRequestType.initial_landlord;
        boolean hasTinDocument = documents.stream()
                .anyMatch(doc -> "TIN".equalsIgnoreCase(doc.getDocumentType()));
        boolean allClaimsHaveNidaDocument = claimedProperties.stream()
                .allMatch(property -> landlordDocumentRepository.existsByLandlordRequestIdAndRequestPropertyIdAndDocumentTypeIgnoreCase(
                        request.getId(), property.getId(), "NIDA"));
        if ((requiresTinDocument && !hasTinDocument) || claimedProperties.isEmpty() || !allClaimsHaveNidaDocument) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "missing_required_documents");
        }

        UserEntity landlord;
        String tempPassword = null;
        if (request.getRequestType() == LandlordRequestType.additional_property) {
            landlord = request.getCreatedLandlord() != null
                    ? request.getCreatedLandlord()
                    : userRepository.findByEmailIgnoreCase(request.getRequesterEmail())
                            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "landlord_not_found"));
        } else {
            landlord = new UserEntity();
            landlord.setEmail(request.getRequesterEmail());
            landlord.setFullName(request.getRequesterFullName());
            landlord.setPhone(request.getRequesterPhone());
            landlord.setRole(UserRole.landlord);
            landlord.setTinNumber(request.getTinNumber());
            landlord.setActive(true);
            landlord.setEmailVerified(false);

            tempPassword = "Lnd_" + UUID.randomUUID().toString().substring(0, 8);
            landlord.setPasswordHash(passwordEncoder.encode(tempPassword));
            landlord.setCreatedBy(agent.getId());
            userRepository.save(landlord);
        }

        for (LandlordRequestPropertyEntity pDto : claimedProperties) {
            PropertyEntity prop = new PropertyEntity();
            prop.setLandlord(landlord);
            prop.setTitle(pDto.getTitle());
            prop.setLocation(pDto.getLocation());
            prop.setPricePerMonth(BigDecimal.ZERO);
            prop.setRooms(0);
            prop.setNeedsImages(true);
            prop.setRegisteredByAgent(agent);
            prop.setApproved(false);
            prop.setPhone(request.getRequesterPhone());
            prop.setContactEmail(request.getRequesterEmail());
            propertyRepository.save(prop);
            pDto.setCreatedPropertyId(prop.getId());
            landlordRequestPropertyRepository.save(pDto);
            
            logService.log(LogAction.PROPERTY_CREATED, "property", prop.getId(), agent.getId(), request.getRequesterEmail(), "Skeletal property registered by agent: " + prop.getTitle());
        }

        request.setStatus(LandlordRequestStatus.approved);
        request.setCreatedLandlord(landlord);
        if (dto.notes() != null) {
            request.setNotes(dto.notes());
        }
        landlordRequestRepository.save(request);

        logService.log(LogAction.LANDLORD_APPROVED, "landlord_request", request.getId(), agent.getId(), request.getRequesterEmail(), "Landlord request approved by agent");

        if (request.getRequestType() == LandlordRequestType.additional_property) {
            notificationService.sendNotification(
                    landlord.getId(),
                    NotificationType.LANDLORD_REQUEST_UPDATE,
                    "Additional Property Verified",
                    "Your additional property request has been verified. Open the dashboard, complete the property details, then wait for final admin or agent approval before it goes public.",
                    request.getId()
            );
        } else {
            String verificationCode = emailVerificationService.generateLandlordVerificationCode(landlord.getEmail());

            emailVerificationService.sendLandlordApprovalEmail(landlord.getEmail(), verificationCode, tempPassword);

            notificationService.sendNotification(
                    landlord.getId(),
                    NotificationType.LANDLORD_REQUEST_UPDATE,
                    "Welcome to RentHub! Account Approved",
                    buildLandlordActivationMessage(verificationCode, tempPassword),
                    request.getId()
            );
        }

        return toResponse(request);
    }

    @Transactional
    public void resendLandlordVerificationEmail(Long requestId, Long actorId) {
        UserEntity actor = userRepository.findById(actorId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));
        if (actor.getRole() != UserRole.admin && actor.getRole() != UserRole.agent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "staff_role_required");
        }

        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));
        if (request.getRequestType() != LandlordRequestType.initial_landlord) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "initial_landlord_required");
        }
        if (request.getStatus() != LandlordRequestStatus.approved || request.getCreatedLandlord() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "landlord_not_approved");
        }

        UserEntity landlord = userRepository.findById(request.getCreatedLandlord().getId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "landlord_not_found"));
        if (landlord.isEmailVerified()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "email_already_verified");
        }

        String verificationCode = emailVerificationService.generateLandlordVerificationCode(landlord.getEmail());
        emailVerificationService.sendLandlordApprovalEmail(landlord.getEmail(), verificationCode, null);
        notificationService.sendNotification(
                landlord.getId(),
                NotificationType.LANDLORD_REQUEST_UPDATE,
                "RentHub Landlord Verification Code",
                buildLandlordActivationMessage(verificationCode, null),
                request.getId()
        );
        logService.log(LogAction.NOTIFICATION_SENT, "landlord_request", request.getId(), actor.getId(), landlord.getEmail(), "Landlord verification email resent by staff");
    }

    private String buildLandlordActivationMessage(String verificationCode, String tempPassword) {
        StringBuilder message = new StringBuilder();
        message.append("Your landlord request has been approved.\n\n")
                .append("Your activation code is: ").append(verificationCode).append("\n");
        if (tempPassword != null && !tempPassword.isBlank()) {
            message.append("Your temporary password is: ").append(tempPassword).append("\n");
        }
        message.append("\n")
                .append("To activate your account, visit the RentHub home page and open the Verify Code menu. ")
                .append("Enter your email, activation code, and choose a new password before logging in.\n\n")
                .append("After activation, log in to your landlord dashboard to complete your property details and upload listing images.");
        return message.toString();
    }

    @Transactional
    public LandlordRequestResponse rejectRequest(Long requestId, String reason, Long agentId) {
        LandlordRequestEntity request = landlordRequestRepository.findById(requestId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "request_not_found"));

        request.setStatus(LandlordRequestStatus.rejected);
        request.setNotes(reason);
        landlordRequestRepository.save(request);

        logService.log(LogAction.LANDLORD_REQUEST_CREATED, "landlord_request", request.getId(), agentId, request.getRequesterEmail(), "Request rejected. Reason: " + reason);

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
        return landlordRequestRepository.findByAssignedAgentIdOrderByCreatedAtDesc(agentId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<LandlordRequestResponse> getAllRequests() {
        return landlordRequestRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public LandlordRequestResponse toResponse(LandlordRequestEntity entity) {
        List<LandlordRequestPropertyResponse> properties = landlordRequestPropertyRepository.findByLandlordRequestIdOrderByIdAsc(entity.getId())
                .stream()
                .map(p -> new LandlordRequestPropertyResponse(
                        p.getId(),
                        p.getTitle(),
                        p.getLocation(),
                        p.isApproved(),
                        p.getCreatedPropertyId()
                ))
                .collect(Collectors.toList());

        List<LandlordDocumentResponse> docs = landlordDocumentRepository.findByLandlordRequestId(entity.getId())
                .stream()
                .map(d -> new LandlordDocumentResponse(
                        d.getId(),
                        d.getLandlordRequest().getId(),
                        d.getDocumentType(),
                        d.getFilePath(),
                        d.getUploadedBy() != null ? d.getUploadedBy().getId() : null,
                        d.getRequestProperty() != null ? d.getRequestProperty().getId() : null,
                        d.getRequestProperty() != null ? d.getRequestProperty().getTitle() : null,
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
                entity.getRequestType(),
                entity.getStatus(),
                entity.getAssignedAgent() != null ? entity.getAssignedAgent().getId() : null,
                entity.getAssignedAgent() != null ? entity.getAssignedAgent().getFullName() : null,
                entity.getCreatedLandlord() != null ? entity.getCreatedLandlord().getId() : null,
                entity.getNotes(),
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                properties,
                docs
        );
    }
}