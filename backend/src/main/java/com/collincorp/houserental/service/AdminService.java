package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.AdminStatsResponse;
import com.collincorp.houserental.dto.AdminUserPatchRequest;
import com.collincorp.houserental.dto.AdminUserSaveRequest;
import com.collincorp.houserental.dto.UserResponse;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.BookingRepository;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.repository.ReservationRepository;
import com.collincorp.houserental.repository.UserRepository;
import com.collincorp.houserental.support.SecurityUtils;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;
    private final BookingRepository bookingRepository;
    private final ReservationRepository reservationRepository;
    private final PasswordEncoder passwordEncoder;
    private final LogService logService;

    public AdminService(
            UserRepository userRepository,
            PropertyRepository propertyRepository,
            BookingRepository bookingRepository,
            ReservationRepository reservationRepository,
            PasswordEncoder passwordEncoder,
            LogService logService) {
        this.userRepository = userRepository;
        this.propertyRepository = propertyRepository;
        this.bookingRepository = bookingRepository;
        this.reservationRepository = reservationRepository;
        this.passwordEncoder = passwordEncoder;
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> users() {
        assertAdmin();
        return userRepository.findAll().stream().map(this::toUser).toList();
    }

    @Transactional
    public UserResponse createUser(AdminUserSaveRequest req) {
        assertAdmin();
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "email_taken");
        }
        UserEntity u = new UserEntity();
        u.setEmail(req.email().trim().toLowerCase());
        if (req.password() == null || req.password().isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "password_required");
        }
        u.setPasswordHash(passwordEncoder.encode(req.password()));
        u.setFullName(req.fullName());
        u.setRole(req.role() != null ? req.role() : UserRole.tenant);
        u.setActive(req.active() != null ? req.active() : true);
        u.setLocality(req.locality());
        u.setPhone(req.phone());
        u.setEmailVerified(true); // Admin-created accounts are auto-verified
        u.setCreatedBy(SecurityUtils.currentUser().getId());
        UserEntity saved = userRepository.save(u);
        logService.log(LogAction.USER_CREATED, "user", saved.getId(), "Admin created user: " + saved.getEmail());
        return toUser(saved);
    }

    @Transactional
    public UserResponse updateUser(long id, AdminUserSaveRequest req) {
        assertAdmin();
        UserEntity u = userRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));
        
        String newEmail = req.email().trim().toLowerCase();
        if (!u.getEmail().equalsIgnoreCase(newEmail)) {
            if (userRepository.existsByEmailIgnoreCase(newEmail)) {
                throw new ApiException(HttpStatus.CONFLICT, "email_taken");
            }
            u.setEmail(newEmail);
        }
        
        if (req.password() != null && !req.password().isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(req.password()));
        }
        if (req.fullName() != null) {
            u.setFullName(req.fullName());
        }
        if (req.role() != null) {
            u.setRole(req.role());
        }
        if (req.active() != null) {
            u.setActive(req.active());
        }
        if (req.locality() != null) {
            u.setLocality(req.locality());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone());
        }
        
        UserEntity saved = userRepository.save(u);
        logService.log(LogAction.USER_UPDATED, "user", saved.getId(), "Admin updated user: " + saved.getEmail());
        return toUser(saved);
    }

    @Transactional
    public UserResponse patchUser(long id, AdminUserPatchRequest req) {
        assertAdmin();
        UserEntity u = userRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));
        if (req.active() != null) {
            u.setActive(req.active());
        }
        if (req.role() != null) {
            u.setRole(req.role());
        }
        if (req.locality() != null) {
            u.setLocality(req.locality());
        }
        if (req.phone() != null) {
            u.setPhone(req.phone());
        }
        UserEntity saved = userRepository.save(u);
        logService.log(LogAction.USER_UPDATED, "user", saved.getId(), "Admin patched user: " + saved.getEmail());
        return toUser(saved);
    }

    @Transactional
    public void deleteUser(long id) {
        assertAdmin();
        UserEntity self = SecurityUtils.currentUser();
        if (self.getId().equals(id)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "cannot_delete_self");
        }
        UserEntity target = userRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));
        
        // Food chain check for super admin deletion
        if (target.getRole() == UserRole.admin) {
            if (target.getCreatedBy() == null || !target.getCreatedBy().equals(self.getId())) {
                throw new ApiException(HttpStatus.FORBIDDEN, "only_creator_can_delete_admin");
            }
        }
        
        userRepository.delete(target);
        logService.log(LogAction.USER_DELETED, "user", id, "Admin deleted user: " + target.getEmail());
    }

    @Transactional(readOnly = true)
    public AdminStatsResponse stats() {
        assertAdmin();
        return new AdminStatsResponse(
                userRepository.count(),
                propertyRepository.count(),
                bookingRepository.count(),
                reservationRepository.count());
    }

    private void assertAdmin() {
        if (SecurityUtils.currentUser().getRole() != UserRole.admin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "admin_only");
        }
    }

    private UserResponse toUser(UserEntity u) {
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
