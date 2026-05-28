package com.collincorp.houserental;

import com.collincorp.houserental.service.LandlordOnboardingService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class LandlordActivationSecurityTests {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private LandlordOnboardingService onboardingService;

    @Test
    void verifyAndActivateAllowsAnonymousRequests() throws Exception {
        mockMvc.perform(post("/api/v1/landlord-requests/verify-and-activate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "landlord@example.com",
                                  "code": "123456",
                                  "newPassword": "password123"
                                }
                                """))
                .andExpect(status().isOk());

        verify(onboardingService).verifyAndActivateLandlord(
                eq("landlord@example.com"),
                eq("123456"),
                eq("password123"));
    }
}
