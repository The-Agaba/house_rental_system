package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.LandlordRequestPropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandlordRequestPropertyRepository extends JpaRepository<LandlordRequestPropertyEntity, Long> {
    List<LandlordRequestPropertyEntity> findByLandlordRequestIdOrderByIdAsc(Long requestId);
}
