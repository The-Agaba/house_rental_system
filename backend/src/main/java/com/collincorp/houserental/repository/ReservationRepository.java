package com.collincorp.houserental.repository;

import com.collincorp.houserental.domain.ReservationStatus;
import com.collincorp.houserental.entity.ReservationEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {
    
    List<ReservationEntity> findByPropertyIdAndStatusInOrderByQueuePositionAsc(Long propertyId, List<ReservationStatus> statuses);
    
    List<ReservationEntity> findByPropertyIdOrderByQueuePositionAsc(Long propertyId);
    
    List<ReservationEntity> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    
    List<ReservationEntity> findByStatusAndConfirmationDeadlineBefore(ReservationStatus status, Instant deadline);

    List<ReservationEntity> findByStatusInAndConfirmationDeadlineBefore(List<ReservationStatus> statuses, Instant deadline);
    
    int countByPropertyIdAndStatusIn(Long propertyId, List<ReservationStatus> activeStatuses);
    
    Optional<ReservationEntity> findFirstByPropertyIdAndStatusOrderByQueuePositionAsc(Long propertyId, ReservationStatus status);

    List<ReservationEntity> findByPropertyLandlordIdOrderByCreatedAtDesc(Long landlordId);

    Optional<ReservationEntity> findFirstByPropertyIdAndStatusInOrderByCreatedAtDesc(Long propertyId, List<ReservationStatus> statuses);

    long countByTenantIdAndStatusIn(Long tenantId, List<ReservationStatus> statuses);

    @Query("""
            select r from ReservationEntity r
            where r.property.id = :propertyId
              and r.status in :statuses
              and (r.confirmationDeadline is null or r.confirmationDeadline > :now)
            order by r.createdAt desc
            """)
    List<ReservationEntity> findActivePropertyHolds(
            @Param("propertyId") Long propertyId,
            @Param("statuses") List<ReservationStatus> statuses,
            @Param("now") Instant now);
}
