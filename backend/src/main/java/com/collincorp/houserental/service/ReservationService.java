package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.NotificationType;
import com.collincorp.houserental.domain.PropertyAvailability;
import com.collincorp.houserental.domain.ReservationStatus;
import com.collincorp.houserental.dto.QueueStatusResponse;
import com.collincorp.houserental.dto.ReservationCreateRequest;
import com.collincorp.houserental.dto.ReservationResponse;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.ReservationEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.repository.ReservationRepository;
import com.collincorp.houserental.repository.UserRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private final ReservationRepository reservationRepository;
    private final PropertyRepository propertyRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final LogService logService;

    public ReservationService(
            ReservationRepository reservationRepository,
            PropertyRepository propertyRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            LogService logService) {
        this.reservationRepository = reservationRepository;
        this.propertyRepository = propertyRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.logService = logService;
    }

    @Transactional
    public ReservationResponse createReservation(ReservationCreateRequest req, Long tenantId) {
        PropertyEntity property = propertyRepository.findById(req.propertyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));

        if (!property.isApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_not_approved");
        }

        if (property.getAvailability() == PropertyAvailability.unavailable) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_not_available");
        }

        UserEntity tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));

        // 1. Calendar Validation: check moveInDate is after computed earliest date
        LocalDate earliestMoveIn = getEarliestMoveInDate(property.getId());
        if (req.moveInDate().isBefore(earliestMoveIn)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "date_before_earliest_allowed");
        }

        // 2. Check if tenant already has an active reservation for this property
        List<ReservationEntity> existing = reservationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        boolean hasActive = existing.stream()
                .filter(r -> r.getProperty().getId().equals(property.getId()))
                .anyMatch(r -> r.getStatus() == ReservationStatus.queued || 
                               r.getStatus() == ReservationStatus.awaiting_confirmation || 
                               r.getStatus() == ReservationStatus.confirmed);
        if (hasActive) {
            throw new ApiException(HttpStatus.CONFLICT, "already_reserving_property");
        }

        // 3. Estimate cost
        BigDecimal cost = property.getPricePerMonth().multiply(BigDecimal.valueOf(req.durationMonths()));

        // 4. Calculate queue position
        int maxPosition = reservationRepository.findByPropertyIdOrderByQueuePositionAsc(property.getId())
                .stream()
                .filter(r -> r.getStatus() == ReservationStatus.queued || 
                             r.getStatus() == ReservationStatus.awaiting_confirmation || 
                             r.getStatus() == ReservationStatus.confirmed)
                .mapToInt(ReservationEntity::getQueuePosition)
                .max()
                .orElse(0);
        int queuePosition = maxPosition + 1;

        ReservationEntity reservation = new ReservationEntity();
        reservation.setProperty(property);
        reservation.setTenant(tenant);
        reservation.setQueuePosition(queuePosition);
        reservation.setMoveInDate(req.moveInDate());
        reservation.setDurationMonths(req.durationMonths());
        reservation.setEstimatedTotalCost(cost);

        if (queuePosition == 1) {
            reservation.setStatus(ReservationStatus.awaiting_confirmation);
            reservation.setConfirmationDeadline(Instant.now().plus(Duration.ofHours(24)));
        } else {
            reservation.setStatus(ReservationStatus.queued);
        }

        reservationRepository.save(reservation);
        logService.log(LogAction.RESERVATION_CREATED, "reservation", reservation.getId(), tenant.getId(), tenant.getEmail(), "Reservation created in queue at position: " + queuePosition);

        // 5. Send notifications
        if (queuePosition == 1) {
            notificationService.sendNotification(
                    tenant.getId(),
                    NotificationType.CONFIRMATION_DEADLINE,
                    "Confirm Your Reservation!",
                    "It's your turn for property '" + property.getTitle() + "'! You have 24 hours to confirm your reservation.",
                    reservation.getId()
            );
        } else {
            notificationService.sendNotification(
                    tenant.getId(),
                    NotificationType.QUEUE_POSITION,
                    "Reservation Joined Queue",
                    "You have successfully joined the reservation queue for '" + property.getTitle() + "' at position " + queuePosition + ".",
                    reservation.getId()
            );
        }

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse confirmReservation(Long reservationId, Long tenantId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "reservation_not_found"));

        if (!reservation.getTenant().getId().equals(tenantId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        if (reservation.getStatus() != ReservationStatus.awaiting_confirmation) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "cannot_confirm_in_current_status");
        }

        if (reservation.getConfirmationDeadline().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "confirmation_window_expired");
        }

        reservation.setStatus(ReservationStatus.confirmed);
        reservation.setConfirmedAt(Instant.now());
        reservationRepository.save(reservation);

        logService.log(LogAction.RESERVATION_CONFIRMED, "reservation", reservation.getId(), tenantId, reservation.getTenant().getEmail(), "Tenant confirmed reservation");

        // Notify landlord
        notificationService.sendNotification(
                reservation.getProperty().getLandlord().getId(),
                NotificationType.PROMOTION,
                "Reservation Confirmed by Tenant",
                "A tenant has confirmed their reservation for your property '" + reservation.getProperty().getTitle() + "'. Please review and accept it.",
                reservation.getId()
        );

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse landlordAcceptReservation(Long reservationId, Long landlordId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "reservation_not_found"));

        if (!reservation.getProperty().getLandlord().getId().equals(landlordId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        if (reservation.getStatus() != ReservationStatus.confirmed) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "reservation_not_confirmed_by_tenant");
        }

        // 1. Accept this reservation
        reservation.setStatus(ReservationStatus.accepted);
        reservation.setQueuePosition(0);
        reservationRepository.save(reservation);

        // 2. Mark property rented
        PropertyEntity property = reservation.getProperty();
        property.setAvailability(PropertyAvailability.rented);
        propertyRepository.save(property);

        logService.log(LogAction.RESERVATION_ACCEPTED, "reservation", reservation.getId(), landlordId, reservation.getProperty().getLandlord().getEmail(), "Landlord accepted reservation");

        // Notify accepted tenant
        notificationService.sendNotification(
                reservation.getTenant().getId(),
                NotificationType.RESERVATION_ACCEPTED,
                "Reservation Accepted!",
                "Congratulations! Your reservation for '" + property.getTitle() + "' has been accepted by the landlord.",
                reservation.getId()
        );

        // 3. Cancel all other active reservations for this property
        List<ReservationEntity> others = reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                property.getId(),
                Arrays.asList(ReservationStatus.queued, ReservationStatus.awaiting_confirmation, ReservationStatus.confirmed)
        );

        for (ReservationEntity other : others) {
            if (!other.getId().equals(reservation.getId())) {
                other.setStatus(ReservationStatus.cancelled);
                other.setQueuePosition(0);
                reservationRepository.save(other);

                logService.log(LogAction.RESERVATION_CANCELLED, "reservation", other.getId(), landlordId, other.getTenant().getEmail(), "System cancelled reservation due to rental");

                notificationService.sendNotification(
                        other.getTenant().getId(),
                        NotificationType.RESERVATION_CANCELLED,
                        "Reservation Cancelled",
                        "The property '" + property.getTitle() + "' has been rented to another tenant. Your reservation has been cancelled.",
                        other.getId()
                );
            }
        }

        return toResponse(reservation);
    }

    @Transactional
    public void processExpiredReservations() {
        Instant now = Instant.now();
        List<ReservationEntity> expired = reservationRepository.findByStatusAndConfirmationDeadlineBefore(
                ReservationStatus.awaiting_confirmation,
                now
        );

        for (ReservationEntity res : expired) {
            res.setStatus(ReservationStatus.expired);
            res.setQueuePosition(0);
            reservationRepository.save(res);

            logService.log(LogAction.RESERVATION_EXPIRED, "reservation", res.getId(), null, res.getTenant().getEmail(), "Reservation confirmation deadline expired");

            notificationService.sendNotification(
                    res.getTenant().getId(),
                    NotificationType.CONFIRMATION_DEADLINE,
                    "Reservation Expired",
                    "Your 24-hour confirmation window for '" + res.getProperty().getTitle() + "' has expired.",
                    res.getId()
            );

            // Promote next in queue
            promoteNextInQueue(res.getProperty().getId());
        }
    }

    @Transactional
    public void cancelReservation(Long reservationId, Long userId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "reservation_not_found"));

        boolean isTenant = reservation.getTenant().getId().equals(userId);
        boolean isLandlord = reservation.getProperty().getLandlord().getId().equals(userId);

        if (!isTenant && !isLandlord) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        ReservationStatus oldStatus = reservation.getStatus();
        if (oldStatus == ReservationStatus.accepted || oldStatus == ReservationStatus.cancelled || oldStatus == ReservationStatus.expired) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "cannot_cancel_inactive_reservation");
        }

        reservation.setStatus(ReservationStatus.cancelled);
        reservation.setQueuePosition(0);
        reservationRepository.save(reservation);

        logService.log(LogAction.RESERVATION_CANCELLED, "reservation", reservation.getId(), userId, reservation.getTenant().getEmail(), "Reservation cancelled by " + (isTenant ? "tenant" : "landlord"));

        // Notify other party
        if (isTenant) {
            notificationService.sendNotification(
                    reservation.getProperty().getLandlord().getId(),
                    NotificationType.RESERVATION_CANCELLED,
                    "Reservation Cancelled by Tenant",
                    "The reservation queue entry for '" + reservation.getProperty().getTitle() + "' was cancelled by the tenant.",
                    reservation.getId()
            );
        } else {
            notificationService.sendNotification(
                    reservation.getTenant().getId(),
                    NotificationType.RESERVATION_CANCELLED,
                    "Reservation Cancelled by Landlord",
                    "Your reservation for '" + reservation.getProperty().getTitle() + "' was cancelled by the landlord.",
                    reservation.getId()
            );
        }

        // If it was the first in line, promote the next one
        if (oldStatus == ReservationStatus.awaiting_confirmation || oldStatus == ReservationStatus.confirmed) {
            promoteNextInQueue(reservation.getProperty().getId());
        }
    }

    private void promoteNextInQueue(Long propertyId) {
        // Find first queued reservation
        Optional<ReservationEntity> nextOpt = reservationRepository.findFirstByPropertyIdAndStatusOrderByQueuePositionAsc(
                propertyId,
                ReservationStatus.queued
        );

        if (nextOpt.isPresent()) {
            ReservationEntity next = nextOpt.get();
            next.setStatus(ReservationStatus.awaiting_confirmation);
            next.setConfirmationDeadline(Instant.now().plus(Duration.ofHours(24)));
            reservationRepository.save(next);

            logService.log(LogAction.RESERVATION_CONFIRMED, "reservation", next.getId(), null, next.getTenant().getEmail(), "Promoted next tenant in queue");

            notificationService.sendNotification(
                    next.getTenant().getId(),
                    NotificationType.PROMOTION,
                    "It's Your Turn! Confirm Your Reservation",
                    "You have been promoted to the front of the queue for '" + next.getProperty().getTitle() + "'! You have 24 hours to confirm your reservation.",
                    next.getId()
            );
        }
    }

    @Transactional(readOnly = true)
    public LocalDate getEarliestMoveInDate(Long propertyId) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));

        List<ReservationEntity> active = reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                propertyId,
                Arrays.asList(ReservationStatus.queued, ReservationStatus.awaiting_confirmation, ReservationStatus.confirmed)
        );

        LocalDate earliest = LocalDate.now().plusDays(1);
        if (property.getAvailability() == PropertyAvailability.rented) {
            LocalDate minimumStartDate = earliest;
            earliest = getActiveRentalEndDate(propertyId)
                    .map(endDate -> endDate.plusDays(2))  // Lease End Date + 48 Hours
                    .filter(endDate -> endDate.isAfter(minimumStartDate))
                    .orElse(minimumStartDate);
        }

        for (ReservationEntity r : active) {
            if (r.getMoveInDate().isAfter(earliest) || r.getMoveInDate().isEqual(earliest)) {
                earliest = r.getMoveInDate().plusMonths(r.getDurationMonths());
            } else {
                earliest = earliest.plusMonths(r.getDurationMonths());
            }
        }
        return earliest;
    }

    private Optional<LocalDate> getActiveRentalEndDate(Long propertyId) {
        return reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                        propertyId,
                        Arrays.asList(ReservationStatus.accepted)
                ).stream()
                .map(r -> r.getMoveInDate().plusMonths(r.getDurationMonths()))
                .max(LocalDate::compareTo);
    }

    @Transactional(readOnly = true)
    public QueueStatusResponse getQueueStatus(Long propertyId) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));

        List<ReservationResponse> active = reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                propertyId,
                Arrays.asList(ReservationStatus.queued, ReservationStatus.awaiting_confirmation, ReservationStatus.confirmed)
        ).stream().map(this::toResponse).collect(Collectors.toList());

        return new QueueStatusResponse(propertyId, property.getTitle(), active.size(), active);
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getMyReservations(Long tenantId) {
        return reservationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getLandlordReservations(Long landlordId) {
        return reservationRepository.findByPropertyLandlordIdOrderByCreatedAtDesc(landlordId)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ReservationResponse> getAllReservations() {
        return reservationRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public ReservationResponse toResponse(ReservationEntity entity) {
        return new ReservationResponse(
                entity.getId(),
                entity.getProperty().getId(),
                entity.getProperty().getTitle(),
                entity.getProperty().getLocation(),
                entity.getTenant().getId(),
                entity.getTenant().getEmail(),
                entity.getTenant().getFullName(),
                entity.getQueuePosition(),
                entity.getStatus(),
                entity.getMoveInDate(),
                entity.getDurationMonths(),
                entity.getEstimatedTotalCost(),
                entity.getConfirmationDeadline(),
                entity.getCreatedAt(),
                entity.getConfirmedAt(),
                entity.getUpdatedAt()
        );
    }
}
