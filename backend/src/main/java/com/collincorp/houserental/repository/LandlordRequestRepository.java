package com.collincorp.houserental.repository;

import com.collincorp.houserental.domain.LandlordRequestStatus;
import com.collincorp.houserental.entity.LandlordRequestEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface LandlordRequestRepository extends JpaRepository<LandlordRequestEntity, Long> {
    List<LandlordRequestEntity> findByStatus(LandlordRequestStatus status);
    List<LandlordRequestEntity> findByAssignedAgentId(Long agentId);
    List<LandlordRequestEntity> findByAssignedAgentIdOrderByCreatedAtDesc(Long agentId);
    List<LandlordRequestEntity> findAllByOrderByCreatedAtDesc();
    List<LandlordRequestEntity> findByLocalityIgnoreCase(String locality);
    List<LandlordRequestEntity> findByRequesterEmailIgnoreCase(String email);

    @Query("""
            select r from LandlordRequestEntity r
            where r.assignedAgent.id = :agentId
               or lower(r.locality) = lower(:locality)
            order by r.createdAt desc
            """)
    List<LandlordRequestEntity> findVisibleToAgentByLocality(
            @Param("agentId") Long agentId,
            @Param("locality") String locality);
}
