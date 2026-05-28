package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.LandlordRequestStatus;
import java.time.Instant;
import java.util.List;

public record LandlordRequestResponse(
        long id,
        String requesterEmail,
        String requesterFullName,
        String requesterPhone,
        String locality,
        String tinNumber,
        LandlordRequestStatus status,
        Long assignedAgentId,
        String assignedAgentName,
        Long createdLandlordId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        List<LandlordDocumentResponse> documents
) {}
