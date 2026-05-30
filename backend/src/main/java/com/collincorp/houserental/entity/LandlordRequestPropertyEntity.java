package com.collincorp.houserental.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "landlord_request_properties")
public class LandlordRequestPropertyEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "landlord_request_id", nullable = false)
    private LandlordRequestEntity landlordRequest;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 512)
    private String location;

    @Column(nullable = false)
    private boolean approved = false;

    @Column(name = "created_property_id")
    private Long createdPropertyId;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    public Long getId() {
        return id;
    }

    public LandlordRequestEntity getLandlordRequest() {
        return landlordRequest;
    }

    public void setLandlordRequest(LandlordRequestEntity landlordRequest) {
        this.landlordRequest = landlordRequest;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public boolean isApproved() {
        return approved;
    }

    public void setApproved(boolean approved) {
        this.approved = approved;
    }

    public Long getCreatedPropertyId() {
        return createdPropertyId;
    }

    public void setCreatedPropertyId(Long createdPropertyId) {
        this.createdPropertyId = createdPropertyId;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
