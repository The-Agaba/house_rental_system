package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.PropertyReviewEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PropertyReviewRepository extends JpaRepository<PropertyReviewEntity, Long> {

    boolean existsByBookingId(Long bookingId);

    boolean existsByPropertyIdAndTenantId(Long propertyId, Long tenantId);

    @Query(
            """
            select r from PropertyReviewEntity r
            join fetch r.tenant
            join fetch r.landlord
            join fetch r.booking
            where r.property.id = :propertyId
            order by r.createdAt desc
            """)
    List<PropertyReviewEntity> findAllForProperty(@Param("propertyId") Long propertyId);

    @Query("select count(r), coalesce(avg(r.rating), 0) from PropertyReviewEntity r where r.property.id = :propertyId")
    Optional<Object[]> calculateStats(@Param("propertyId") Long propertyId);
}
