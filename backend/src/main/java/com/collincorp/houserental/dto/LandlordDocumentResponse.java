package com.collincorp.houserental.dto;

import java.time.Instant;

public record LandlordDocumentResponse(
        long id,
        long landlordRequestId,
        String documentType,
        String filePath,
        Long uploadedById,
        Instant uploadedAt
) {}
