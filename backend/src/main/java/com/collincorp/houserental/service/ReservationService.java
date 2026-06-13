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
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ReservationService {

    private static final int MAX_ACTIVE_TENANT_RESERVATIONS = 3;

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
        processExpiredReservations();

        PropertyEntity property = propertyRepository.findById(req.propertyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));

        if (!property.isApproved()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_not_approved");
        }

        if (property.getAvailability() != PropertyAvailability.available) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "property_not_available");
        }

        UserEntity tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "user_not_found"));

        if (req.appointmentAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "appointment_must_be_in_future");
        }

        if (!req.appointmentAt().toLocalDate().isBefore(req.moveInDate())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "appointment_must_be_before_move_in");
        }

        // 1. Calendar Validation: check moveInDate is after computed earliest date
        LocalDate earliestMoveIn = getEarliestMoveInDate(property.getId());
        if (req.moveInDate().isBefore(earliestMoveIn)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "date_before_earliest_allowed");
        }

        // 2. Check if tenant already has an active reservation for this property
        List<ReservationEntity> existing = reservationRepository.findByTenantIdOrderByCreatedAtDesc(tenantId);
        boolean hasActive = existing.stream()
                .filter(r -> r.getProperty().getId().equals(property.getId()))
                .anyMatch(r -> activeHoldStatuses().contains(r.getStatus()));
        if (hasActive) {
            throw new ApiException(HttpStatus.CONFLICT, "already_reserving_property");
        }

        long activeTenantReservations = reservationRepository.countByTenantIdAndStatusIn(tenantId, activeHoldStatuses());
        if (activeTenantReservations >= MAX_ACTIVE_TENANT_RESERVATIONS) {
            throw new ApiException(HttpStatus.CONFLICT, "tenant_active_reservation_limit_reached");
        }

        if (!reservationRepository.findActivePropertyHolds(property.getId(), activeHoldStatuses(), Instant.now()).isEmpty()) {
            throw new ApiException(HttpStatus.CONFLICT, "property_already_reserved");
        }

        // 3. Estimate cost
        BigDecimal cost = property.getPricePerMonth().multiply(BigDecimal.valueOf(req.durationMonths()));

        ReservationEntity reservation = new ReservationEntity();
        reservation.setProperty(property);
        reservation.setTenant(tenant);
        reservation.setQueuePosition(0);
        reservation.setMoveInDate(req.moveInDate());
        reservation.setAppointmentAt(req.appointmentAt());
        reservation.setDurationMonths(req.durationMonths());
        reservation.setEstimatedTotalCost(cost);
        reservation.setStatus(ReservationStatus.pending_landlord_confirmation);
        reservation.setConfirmationDeadline(Instant.now().plus(Duration.ofHours(24)));

        reservationRepository.save(reservation);
        
        property.setAvailability(PropertyAvailability.reserved);
        propertyRepository.save(property);

        logService.log(LogAction.RESERVATION_CREATED, "reservation", reservation.getId(), tenant.getId(), tenant.getEmail(), "Property reserved on a 24-hour hold pending landlord appointment confirmation");

        notifyReservationCreated(reservation);

        return toResponse(reservation);
    }

    @Transactional
    public ReservationResponse confirmReservation(Long reservationId, Long tenantId) {
        return landlordConfirmAppointment(reservationId, tenantId, null);
    }

    @Transactional
    public ReservationResponse landlordConfirmAppointment(Long reservationId, Long landlordId, String notes) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "reservation_not_found"));

        if (!reservation.getProperty().getLandlord().getId().equals(landlordId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        if (reservation.getStatus() != ReservationStatus.pending_landlord_confirmation
                && reservation.getStatus() != ReservationStatus.awaiting_confirmation) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "cannot_confirm_in_current_status");
        }

        if (reservation.getConfirmationDeadline().isBefore(Instant.now())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "confirmation_window_expired");
        }

        reservation.setStatus(ReservationStatus.confirmed);
        reservation.setConfirmedAt(Instant.now());
        reservation.setAppointmentConfirmedAt(Instant.now());
        reservation.setLandlordResponseNotes(notes);
        reservationRepository.save(reservation);

        logService.log(LogAction.RESERVATION_CONFIRMED, "reservation", reservation.getId(), landlordId, reservation.getTenant().getEmail(), "Landlord confirmed requested viewing appointment");

        notificationService.sendNotification(
                reservation.getTenant().getId(),
                NotificationType.PROMOTION,
                "Viewing Appointment Confirmed",
                "The landlord confirmed your viewing appointment for '" + reservation.getProperty().getTitle() + "' on " + formatAppointment(reservation.getAppointmentAt()) + ".",
                buildReservationEmailHtml("Viewing Appointment Confirmed", "Your requested viewing appointment has been confirmed.", reservation),
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
        String tenantMessage = "Congratulations! Your reservation for '" + property.getTitle() + "' has been accepted by the landlord.";
        notificationService.sendNotification(
                reservation.getTenant().getId(),
                NotificationType.RESERVATION_ACCEPTED,
                "Reservation Accepted!",
                tenantMessage,
                buildReservationEmailHtml("Reservation Accepted!", tenantMessage, reservation),
                reservation.getId()
        );

        // 3. Cancel all other active reservations for this property
        List<ReservationEntity> others = reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                property.getId(),
                activeHoldStatuses()
        );

        for (ReservationEntity other : others) {
            if (!other.getId().equals(reservation.getId())) {
                other.setStatus(ReservationStatus.cancelled);
                other.setQueuePosition(0);
                reservationRepository.save(other);

                logService.log(LogAction.RESERVATION_CANCELLED, "reservation", other.getId(), landlordId, other.getTenant().getEmail(), "System cancelled reservation due to rental");

                String cancelMsg = "The property '" + property.getTitle() + "' has been rented to another tenant. Your reservation has been cancelled.";
                notificationService.sendNotification(
                        other.getTenant().getId(),
                        NotificationType.RESERVATION_CANCELLED,
                        "Reservation Cancelled",
                        cancelMsg,
                        buildReservationEmailHtml("Reservation Cancelled", cancelMsg, other),
                        other.getId()
                );
            }
        }

        return toResponse(reservation);
    }

    @Transactional
    public void processExpiredReservations() {
        Instant now = Instant.now();
        List<ReservationEntity> expired = reservationRepository.findByStatusInAndConfirmationDeadlineBefore(
                activeHoldStatuses(),
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
                    "Your 24-hour reservation hold for '" + res.getProperty().getTitle() + "' has expired.",
                    buildReservationEmailHtml("Reservation Hold Expired", "Your reservation hold has expired and the property can now be reserved by another tenant.", res),
                    res.getId()
            );

            notificationService.sendNotification(
                    res.getProperty().getLandlord().getId(),
                    NotificationType.RESERVATION_CANCELLED,
                    "Reservation Hold Expired",
                    "The 24-hour hold for '" + res.getProperty().getTitle() + "' has expired because the viewing appointment was not confirmed in time.",
                    buildReservationEmailHtml("Reservation Hold Expired", "The viewing appointment was not confirmed before the hold expired.", res),
                    res.getId()
            );
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
                    "The reservation hold for '" + reservation.getProperty().getTitle() + "' was cancelled by the tenant. The property is available for reservation again.",
                    buildReservationEmailHtml("Reservation Cancelled by Tenant", "The tenant cancelled this reservation hold.", reservation),
                    reservation.getId()
            );
        } else {
            notificationService.sendNotification(
                    reservation.getTenant().getId(),
                    NotificationType.RESERVATION_CANCELLED,
                    "Reservation Cancelled by Landlord",
                    "Your reservation for '" + reservation.getProperty().getTitle() + "' was cancelled by the landlord. The property hold has been released.",
                    buildReservationEmailHtml("Reservation Cancelled by Landlord", "The landlord cancelled this reservation hold.", reservation),
                    reservation.getId()
            );
        }
    }

    private void promoteNextInQueue(Long propertyId) {
        // Queue promotion has been retired. A cancelled or expired hold simply releases the property.
    }

    @Transactional(readOnly = true)
    public LocalDate getEarliestMoveInDate(Long propertyId) {
        PropertyEntity property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));

        List<ReservationEntity> active = reservationRepository.findByPropertyIdAndStatusInOrderByQueuePositionAsc(
                propertyId,
                activeHoldStatuses()
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
            if (r.getStatus() == ReservationStatus.accepted) {
                if (r.getMoveInDate().isAfter(earliest) || r.getMoveInDate().isEqual(earliest)) {
                    earliest = r.getMoveInDate().plusMonths(r.getDurationMonths());
                } else {
                    earliest = earliest.plusMonths(r.getDurationMonths());
                }
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

        List<ReservationEntity> active = reservationRepository.findActivePropertyHolds(
                propertyId,
                activeHoldStatuses(),
                Instant.now()
        );

        ReservationEntity current = active.isEmpty() ? null : active.get(0);
        return new QueueStatusResponse(
                propertyId,
                property.getTitle(),
                active.size(),
                List.of(),
                current != null,
                current != null ? current.getStatus() : null,
                current != null ? current.getConfirmationDeadline() : null,
                current != null && current.getAppointmentConfirmedAt() != null
        );
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

    @Transactional(readOnly = true)
    public byte[] generateConfirmationLetter(Long reservationId, Long userId) {
        ReservationEntity reservation = reservationRepository.findById(reservationId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "reservation_not_found"));

        boolean isTenant = reservation.getTenant().getId().equals(userId);
        boolean isLandlord = reservation.getProperty().getLandlord().getId().equals(userId);
        if (!isTenant && !isLandlord) {
            throw new ApiException(HttpStatus.FORBIDDEN, "unauthorized");
        }

        if (reservation.getStatus() != ReservationStatus.accepted) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "confirmation_letter_available_after_acceptance");
        }

        try (ByteArrayOutputStream out = new ByteArrayOutputStream();
             PdfWriter writer = new PdfWriter(out);
             PdfDocument pdf = new PdfDocument(writer);
             Document document = new Document(pdf)) {

            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            PdfFont bold = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            document.setFont(regular);

            PropertyEntity property = reservation.getProperty();
            UserEntity tenant = reservation.getTenant();
            UserEntity landlord = property.getLandlord();
            LocalDate moveOutDate = reservation.getMoveInDate().plusMonths(reservation.getDurationMonths());

            document.add(new Paragraph("RentHub Rental Confirmation Letter")
                    .setFont(bold)
                    .setFontSize(18)
                    .setTextAlignment(TextAlignment.CENTER));
            document.add(new Paragraph("Official approved tenant confirmation")
                    .setFontSize(10)
                    .setTextAlignment(TextAlignment.CENTER));

            document.add(new Paragraph("This letter confirms that the tenant named below has been approved by the landlord and RentHub system for the listed rental house.")
                    .setMarginTop(20));

            Table table = new Table(UnitValue.createPercentArray(new float[]{34, 66}))
                    .useAllAvailableWidth()
                    .setMarginTop(12);
            addRow(table, bold, "Confirmation ID", "RH-" + reservation.getId());
            addRow(table, bold, "House", property.getTitle());
            addRow(table, bold, "Exact Location", property.getLocation());
            addRow(table, bold, "Tenant", tenant.getFullName());
            addRow(table, bold, "Tenant Email", tenant.getEmail());
            addRow(table, bold, "Landlord", landlord.getFullName());
            addRow(table, bold, "Landlord Email", contactOrFallback(property.getContactEmail(), landlord.getEmail()));
            addRow(table, bold, "Landlord Phone", contactOrFallback(property.getPhone(), landlord.getPhone()));
            addRow(table, bold, "Move-in Date", reservation.getMoveInDate().toString());
            addRow(table, bold, "Move-out Date", moveOutDate.toString());
            addRow(table, bold, "Duration", reservation.getDurationMonths() + " month(s)");
            addRow(table, bold, "Total Estimated Cost", formatCurrency(reservation.getEstimatedTotalCost()));
            addRow(table, bold, "Approval Status", "Approved by tenant, landlord, and RentHub system");
            document.add(table);

            document.add(new Paragraph("Instructions")
                    .setFont(bold)
                    .setFontSize(13)
                    .setMarginTop(18));
            document.add(new Paragraph("- Report at the property on the move-in date and meet the landlord or assigned agent for handover."));
            document.add(new Paragraph("- Carry a valid identification document, payment proof, and any rental contract documents shared by the landlord."));
            document.add(new Paragraph("- For lease extension or maintenance requests, contact the landlord directly using the details above because those workflows are not yet implemented in the system."));

            document.add(new Paragraph("Generated on " + LocalDate.now())
                    .setFontSize(9)
                    .setTextAlignment(TextAlignment.RIGHT)
                    .setMarginTop(24));
            document.close();
            return out.toByteArray();
        } catch (Exception ex) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "confirmation_letter_generation_failed");
        }
    }

    private void addRow(Table table, PdfFont bold, String label, String value) {
        table.addCell(new Cell().add(new Paragraph(label).setFont(bold)));
        table.addCell(new Cell().add(new Paragraph(value == null || value.isBlank() ? "N/A" : value)));
    }

    private String contactOrFallback(String preferred, String fallback) {
        return preferred != null && !preferred.isBlank() ? preferred : fallback;
    }

    private String formatCurrency(BigDecimal amount) {
        NumberFormat format = NumberFormat.getCurrencyInstance(Locale.US);
        return format.format(amount == null ? BigDecimal.ZERO : amount).replace("$", "TZS ");
    }

    private List<ReservationStatus> activeHoldStatuses() {
        return Arrays.asList(
                ReservationStatus.pending_landlord_confirmation,
                ReservationStatus.confirmed,
                ReservationStatus.awaiting_confirmation
        );
    }

    private void notifyReservationCreated(ReservationEntity reservation) {
        PropertyEntity property = reservation.getProperty();
        UserEntity tenant = reservation.getTenant();
        UserEntity landlord = property.getLandlord();

        String landlordMessage = "A tenant requested to view '" + property.getTitle() + "' on "
                + formatAppointment(reservation.getAppointmentAt())
                + ". The property is held for this tenant for 24 hours. Confirm the appointment in your dashboard if you can attend.";
        notificationService.sendNotification(
                landlord.getId(),
                NotificationType.PROMOTION,
                "New Viewing Appointment Request",
                landlordMessage,
                buildReservationEmailHtml("New Viewing Appointment Request", landlordMessage, reservation),
                reservation.getId()
        );

        String tenantMessage = "Your reservation hold for '" + property.getTitle() + "' is active for 24 hours while the landlord confirms your viewing appointment on "
                + formatAppointment(reservation.getAppointmentAt()) + ".";
        notificationService.sendNotification(
                tenant.getId(),
                NotificationType.CONFIRMATION_DEADLINE,
                "Property Reserved for 24 Hours",
                tenantMessage,
                buildReservationEmailHtml("Property Reserved for 24 Hours", tenantMessage, reservation),
                reservation.getId()
        );
    }

    private String formatAppointment(LocalDateTime appointmentAt) {
        return appointmentAt == null ? "the requested time" : appointmentAt.toString().replace('T', ' ');
    }

    private String buildReservationEmailHtml(String heading, String intro, ReservationEntity reservation) {
        PropertyEntity property = reservation.getProperty();
        return """
                <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
                  <h2 style="margin:0 0 12px;color:#2563eb">%s</h2>
                  <p style="margin:0 0 16px">%s</p>
                  <table style="border-collapse:collapse;width:100%%;max-width:620px">
                    <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Property</td><td style="padding:8px;border:1px solid #e2e8f0">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Location</td><td style="padding:8px;border:1px solid #e2e8f0">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Viewing appointment</td><td style="padding:8px;border:1px solid #e2e8f0">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Move-in date</td><td style="padding:8px;border:1px solid #e2e8f0">%s</td></tr>
                    <tr><td style="padding:8px;border:1px solid #e2e8f0;font-weight:700">Hold expires</td><td style="padding:8px;border:1px solid #e2e8f0">%s</td></tr>
                  </table>
                  <p style="margin-top:16px;color:#475569">Open your RentHub dashboard for the next action. Tenant personal details are only shown to authorized users inside the system.</p>
                </div>
                """.formatted(
                escapeHtml(heading),
                escapeHtml(intro),
                escapeHtml(property.getTitle()),
                escapeHtml(property.getLocation()),
                escapeHtml(formatAppointment(reservation.getAppointmentAt())),
                reservation.getMoveInDate(),
                reservation.getConfirmationDeadline()
        );
    }

    private String escapeHtml(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    public ReservationResponse toResponse(ReservationEntity entity) {
        PropertyEntity property = entity.getProperty();
        UserEntity landlord = property.getLandlord();
        return new ReservationResponse(
                entity.getId(),
                property.getId(),
                property.getTitle(),
                property.getLocation(),
                landlord.getFullName(),
                contactOrFallback(property.getContactEmail(), landlord.getEmail()),
                contactOrFallback(property.getPhone(), landlord.getPhone()),
                entity.getTenant().getId(),
                entity.getTenant().getEmail(),
                entity.getTenant().getFullName(),
                entity.getQueuePosition(),
                entity.getStatus(),
                entity.getMoveInDate(),
                entity.getDurationMonths(),
                entity.getEstimatedTotalCost(),
                entity.getConfirmationDeadline(),
                entity.getAppointmentAt(),
                entity.getAppointmentConfirmedAt(),
                entity.getLandlordResponseNotes(),
                entity.getCreatedAt(),
                entity.getConfirmedAt(),
                entity.getUpdatedAt()
        );
    }
}
