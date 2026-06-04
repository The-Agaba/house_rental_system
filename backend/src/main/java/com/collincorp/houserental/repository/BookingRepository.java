package com.collincorp.houserental.repository;

import com.collincorp.houserental.entity.BookingEntity;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BookingRepository extends JpaRepository<BookingEntity, Long> {

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where b.tenant.id = :userId or p.landlord.id = :userId
            order by b.createdAt desc
            """)
    List<BookingEntity> findAllForUser(@Param("userId") Long userId);

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where b.tenant.id = :tenantId
            order by b.createdAt desc
            """)
    List<BookingEntity> findAllForTenant(@Param("tenantId") Long tenantId);

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where p.landlord.id = :landlordId
            order by b.createdAt desc
            """)
    List<BookingEntity> findAllForLandlord(@Param("landlordId") Long landlordId);

    long countByPropertyId(Long propertyId);

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where p.id = :propertyId
              and b.tenant.id = :tenantId
              and (
                    b.status = com.collincorp.houserental.domain.BookingStatus.completed
                    or (b.status = com.collincorp.houserental.domain.BookingStatus.approved and b.endDate <= :today)
              )
              and not exists (
                    select r.id from PropertyReviewEntity r
                    where r.booking.id = b.id
              )
            order by b.endDate desc, b.id desc
            """)
    List<BookingEntity> findReviewEligibleBookings(
            @Param("propertyId") Long propertyId,
            @Param("tenantId") Long tenantId,
            @Param("today") LocalDate today);

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where p.id = :propertyId
              and b.tenant.id = :tenantId
              and (
                    b.status = com.collincorp.houserental.domain.BookingStatus.completed
                    or (b.status = com.collincorp.houserental.domain.BookingStatus.approved and b.endDate <= :today)
              )
            order by b.endDate desc, b.id desc
            """)
    List<BookingEntity> findCompletedRentalRecords(
            @Param("propertyId") Long propertyId,
            @Param("tenantId") Long tenantId,
            @Param("today") LocalDate today);

    @Query(
            """
            select b from BookingEntity b
            join fetch b.property p
            join fetch p.landlord
            join fetch b.tenant
            where b.feedbackEmailSentAt is null
              and b.endDate = :today
              and b.status in (
                    com.collincorp.houserental.domain.BookingStatus.approved,
                    com.collincorp.houserental.domain.BookingStatus.completed
              )
            """)
    List<BookingEntity> findBookingsEndingTodayWithoutFeedbackEmail(@Param("today") LocalDate today);

    Optional<BookingEntity> findFirstByPropertyIdAndTenantIdOrderByEndDateDescIdDesc(Long propertyId, Long tenantId);
}
