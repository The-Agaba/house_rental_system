package com.collincorp.houserental.repository;

import com.collincorp.houserental.domain.ReservationStatus;
import com.collincorp.houserental.entity.ReservationEntity;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReservationRepository extends JpaRepository<ReservationEntity, Long> {
    
    List<ReservationEntity> findByPropertyIdAndStatusInOrderByQueuePositionAsc(Long propertyId, List<ReservationStatus> statuses);
    
    List<ReservationEntity> findByPropertyIdOrderByQueuePositionAsc(Long propertyId);
    
    List<ReservationEntity> findByTenantIdOrderByCreatedAtDesc(Long tenantId);
    
    List<ReservationEntity> findByStatusAndConfirmationDeadlineBefore(ReservationStatus status, Instant deadline);
    
    int countByPropertyIdAndStatusIn(Long propertyId, List<ReservationStatus> activeStatuses);
    
    Optional<ReservationEntity> findFirstByPropertyIdAndStatusOrderByQueuePositionAsc(Long propertyId, ReservationStatus status);

    List<ReservationEntity> findByPropertyLandlordIdOrderByCreatedAtDesc(Long landlordId);
}
