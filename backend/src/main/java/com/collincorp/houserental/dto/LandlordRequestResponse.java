package com.collincorp.houserental.dto;

import com.collincorp.houserental.domain.LandlordRequestStatus;
import com.collincorp.houserental.domain.LandlordRequestType;
import java.time.Instant;
import java.util.List;

public record LandlordRequestResponse(
        long id,
        String requesterEmail,
        String requesterFullName,
        String requesterPhone,
        String locality,
        String tinNumber,
        LandlordRequestType requestType,
        LandlordRequestStatus status,
        Long assignedAgentId,
        String assignedAgentName,
        Long createdLandlordId,
        String notes,
        Instant createdAt,
        Instant updatedAt,
        List<LandlordRequestPropertyResponse> properties,
        List<LandlordDocumentResponse> documents
) {}
