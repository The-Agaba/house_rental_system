package com.collincorp.houserental;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.PropertyAvailability;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.AdminUserSaveRequest;
import com.collincorp.houserental.dto.PropertyCreateRequest;
import com.collincorp.houserental.dto.PropertyResponse;
import com.collincorp.houserental.dto.UserResponse;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.UserRepository;
import com.collincorp.houserental.security.AppUserDetails;
import com.collincorp.houserental.service.AdminService;
import com.collincorp.houserental.service.PropertyService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class SuperAdminFeatureTests {

    @Autowired
    private AdminService adminService;

    @Autowired
    private PropertyService propertyService;

    @Autowired
    private UserRepository userRepository;

    private UserEntity superAdminA;
    private UserEntity superAdminC;
    private UserEntity landlord;

    @BeforeEach
    void setUp() {
        // Create test users in DB
        userRepository.deleteAll();

        superAdminA = new UserEntity();
        superAdminA.setEmail("admin-a@test.com");
        superAdminA.setFullName("Super Admin A");
        superAdminA.setRole(UserRole.admin);
        superAdminA.setPasswordHash("hash");
        superAdminA.setActive(true);
        superAdminA = userRepository.save(superAdminA);

        superAdminC = new UserEntity();
        superAdminC.setEmail("admin-c@test.com");
        superAdminC.setFullName("Super Admin C");
        superAdminC.setRole(UserRole.admin);
        superAdminC.setPasswordHash("hash");
        superAdminC.setActive(true);
        superAdminC = userRepository.save(superAdminC);

        landlord = new UserEntity();
        landlord.setEmail("landlord@test.com");
        landlord.setFullName("Landlord Test");
        landlord.setRole(UserRole.landlord);
        landlord.setPasswordHash("hash");
        landlord.setActive(true);
        landlord = userRepository.save(landlord);
    }

    private void authenticate(UserEntity user) {
        AppUserDetails details = new AppUserDetails(user);
        Authentication auth = new UsernamePasswordAuthenticationToken(details, null, details.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void testSuperAdminCrudAndFoodChainDeletion() {
        // 1. Authenticate as Admin A
        authenticate(superAdminA);

        // 2. Admin A creates Admin B
        AdminUserSaveRequest createReq = new AdminUserSaveRequest(
                "admin-b@test.com",
                "AdminPassword@123",
                "Super Admin B",
                UserRole.admin,
                true,
                null,
                null
        );
        UserResponse adminBResponse = adminService.createUser(createReq);
        assertNotNull(adminBResponse);
        assertEquals("admin-b@test.com", adminBResponse.email());
        assertEquals(superAdminA.getId(), adminBResponse.createdBy());

        // Reload Admin B from DB to get the entity
        UserEntity superAdminB = userRepository.findById(adminBResponse.id()).orElseThrow();

        // 3. Authenticate as Admin C (who did NOT create Admin B) and try to delete Admin B
        authenticate(superAdminC);
        ApiException ex = assertThrows(ApiException.class, () -> {
            adminService.deleteUser(superAdminB.getId());
        });
        assertEquals("only_creator_can_delete_admin", ex.getMessage());

        // 4. Authenticate back as Admin A (who created Admin B) and delete Admin B
        authenticate(superAdminA);
        assertDoesNotThrow(() -> adminService.deleteUser(superAdminB.getId()));
        assertFalse(userRepository.findById(superAdminB.getId()).isPresent());
    }

    @Test
    void testPropertyApprovalFlow() {
        // 1. Authenticate as Landlord and create a property listing
        authenticate(landlord);
        PropertyCreateRequest createReq = new PropertyCreateRequest(
                "Beautiful Cozy Apartment",
                "A very cozy place near downtown",
                "Downtown",
                BigDecimal.valueOf(1500),
                2,
                PropertyAvailability.available,
                "+123456789",
                "landlord@test.com"
        );
        PropertyResponse createdResponse = propertyService.create(createReq);
        assertNotNull(createdResponse);
        assertFalse(createdResponse.approved(), "Listing created by Landlord should NOT be approved by default");

        // 2. Authenticate as Admin and approve the property listing
        authenticate(superAdminA);
        PropertyResponse approvedResponse = propertyService.approve(createdResponse.id(), true);
        assertNotNull(approvedResponse);
        assertTrue(approvedResponse.approved(), "Listing approved by Super Admin should show approved = true");

        // 3. Admin can unapprove (leave it)
        PropertyResponse unapprovedResponse = propertyService.approve(createdResponse.id(), false);
        assertNotNull(unapprovedResponse);
        assertFalse(unapprovedResponse.approved(), "Listing unapproved by Super Admin should show approved = false");
    }
}
