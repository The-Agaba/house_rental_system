package com.collincorp.houserental.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "landlord_documents")
public class LandlordDocumentEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "landlord_request_id", nullable = false)
    private LandlordRequestEntity landlordRequest;

    @Column(name = "document_type", nullable = false)
    private String documentType; // "NIDA", "TIN", "OTHER"

    @Column(name = "file_path", nullable = false, length = 1024)
    private String filePath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by_id")
    private UserEntity uploadedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_property_id")
    private LandlordRequestPropertyEntity requestProperty;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt = Instant.now();

    public Long getId() {
        return id;
    }

    public LandlordRequestEntity getLandlordRequest() {
        return landlordRequest;
    }

    public void setLandlordRequest(LandlordRequestEntity landlordRequest) {
        this.landlordRequest = landlordRequest;
    }

    public String getDocumentType() {
        return documentType;
    }

    public void setDocumentType(String documentType) {
        this.documentType = documentType;
    }

    public String getFilePath() {
        return filePath;
    }

    public void setFilePath(String filePath) {
        this.filePath = filePath;
    }

    public UserEntity getUploadedBy() {
        return uploadedBy;
    }

    public void setUploadedBy(UserEntity uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public LandlordRequestPropertyEntity getRequestProperty() {
        return requestProperty;
    }

    public void setRequestProperty(LandlordRequestPropertyEntity requestProperty) {
        this.requestProperty = requestProperty;
    }

    public Instant getUploadedAt() {
        return uploadedAt;
    }

    public void setUploadedAt(Instant uploadedAt) {
        this.uploadedAt = uploadedAt;
    }
}
