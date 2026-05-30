package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.LandlordDocumentEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandlordDocumentRepository extends JpaRepository<LandlordDocumentEntity, Long> {
    List<LandlordDocumentEntity> findByLandlordRequestId(Long requestId);
    boolean existsByLandlordRequestIdAndRequestPropertyIdAndDocumentTypeIgnoreCase(Long requestId, Long requestPropertyId, String documentType);
}
