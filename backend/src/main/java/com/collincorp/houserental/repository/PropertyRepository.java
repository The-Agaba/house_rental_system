package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.PropertyEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface PropertyRepository extends JpaRepository<PropertyEntity, Long>, JpaSpecificationExecutor<PropertyEntity> {
    List<PropertyEntity> findAllByLandlordIdOrderByIdDesc(Long landlordId);
    List<PropertyEntity> findAllByLandlordLocalityIgnoreCaseOrderByIdDesc(String locality);
}
