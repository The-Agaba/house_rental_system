package com.collincorp.houserental.entity;

import com.collincorp.houserental.domain.LandlordRequestStatus;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "landlord_requests")
public class LandlordRequestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(name = "requester_full_name", nullable = false)
    private String requesterFullName;

    @Column(name = "requester_phone", nullable = false)
    private String requesterPhone;

    @Column(nullable = false)
    private String locality;

    @Column(name = "tin_number", nullable = false)
    private String tinNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LandlordRequestStatus status = LandlordRequestStatus.pending;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_agent_id")
    private UserEntity assignedAgent;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_landlord_id")
    private UserEntity createdLandlord;

    @Column(columnDefinition = "text")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }

    public Long getId() {
        return id;
    }

    public String getRequesterEmail() {
        return requesterEmail;
    }

    public void setRequesterEmail(String requesterEmail) {
        this.requesterEmail = requesterEmail;
    }

    public String getRequesterFullName() {
        return requesterFullName;
    }

    public void setRequesterFullName(String requesterFullName) {
        this.requesterFullName = requesterFullName;
    }

    public String getRequesterPhone() {
        return requesterPhone;
    }

    public void setRequesterPhone(String requesterPhone) {
        this.requesterPhone = requesterPhone;
    }

    public String getLocality() {
        return locality;
    }

    public void setLocality(String locality) {
        this.locality = locality;
    }

    public String getTinNumber() {
        return tinNumber;
    }

    public void setTinNumber(String tinNumber) {
        this.tinNumber = tinNumber;
    }

    public LandlordRequestStatus getStatus() {
        return status;
    }

    public void setStatus(LandlordRequestStatus status) {
        this.status = status;
    }

    public UserEntity getAssignedAgent() {
        return assignedAgent;
    }

    public void setAssignedAgent(UserEntity assignedAgent) {
        this.assignedAgent = assignedAgent;
    }

    public UserEntity getCreatedLandlord() {
        return createdLandlord;
    }

    public void setCreatedLandlord(UserEntity createdLandlord) {
        this.createdLandlord = createdLandlord;
    }

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(Instant createdAt) {
        this.createdAt = createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(Instant updatedAt) {
        this.updatedAt = updatedAt;
    }
}
