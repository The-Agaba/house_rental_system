package com.collincorp.houserental.repository;

import com.collincorp.houserental.domain.LandlordRequestStatus;
import com.collincorp.houserental.entity.LandlordRequestEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandlordRequestRepository extends JpaRepository<LandlordRequestEntity, Long> {
    List<LandlordRequestEntity> findByStatus(LandlordRequestStatus status);
    List<LandlordRequestEntity> findByAssignedAgentId(Long agentId);
    List<LandlordRequestEntity> findByLocalityIgnoreCase(String locality);
    Optional<LandlordRequestEntity> findByRequesterEmailIgnoreCase(String email);
}
