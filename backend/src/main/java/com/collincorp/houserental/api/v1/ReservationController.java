package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.dto.*;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.service.ReservationService;
import com.collincorp.houserental.support.SecurityUtils;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/reservations")
public class ReservationController {

    private final ReservationService reservationService;

    public ReservationController(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    @PostMapping
    public ResponseEntity<ReservationResponse> createReservation(@Valid @RequestBody ReservationCreateRequest req) {
        UserEntity tenant = SecurityUtils.currentUser();
        return ResponseEntity.ok(reservationService.createReservation(req, tenant.getId()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<ReservationResponse>> getMyReservations() {
        UserEntity tenant = SecurityUtils.currentUser();
        return ResponseEntity.ok(reservationService.getMyReservations(tenant.getId()));
    }

    @GetMapping("/property/{propertyId}/queue")
    public ResponseEntity<QueueStatusResponse> getQueueStatus(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reservationService.getQueueStatus(propertyId));
    }

    @GetMapping("/property/{propertyId}/available-dates")
    public ResponseEntity<LocalDate> getAvailableMoveInDate(@PathVariable Long propertyId) {
        return ResponseEntity.ok(reservationService.getEarliestMoveInDate(propertyId));
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<ReservationResponse> confirmReservation(@PathVariable Long id) {
        UserEntity tenant = SecurityUtils.currentUser();
        return ResponseEntity.ok(reservationService.confirmReservation(id, tenant.getId()));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<ReservationResponse> acceptReservation(@PathVariable Long id) {
        UserEntity landlord = SecurityUtils.currentUser();
        return ResponseEntity.ok(reservationService.landlordAcceptReservation(id, landlord.getId()));
    }

    @GetMapping("/landlord")
    public ResponseEntity<List<ReservationResponse>> getLandlordReservations() {
        UserEntity landlord = SecurityUtils.currentUser();
        return ResponseEntity.ok(reservationService.getLandlordReservations(landlord.getId()));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<String> cancelReservation(@PathVariable Long id) {
        UserEntity user = SecurityUtils.currentUser();
        reservationService.cancelReservation(id, user.getId());
        return ResponseEntity.ok("Reservation cancelled successfully");
    }

    @GetMapping("/{id}/confirmation-letter")
    public ResponseEntity<byte[]> downloadConfirmationLetter(@PathVariable Long id) {
        UserEntity user = SecurityUtils.currentUser();
        byte[] letter = reservationService.generateConfirmationLetter(id, user.getId());
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"rental-confirmation-" + id + ".pdf\"")
                .body(letter);
    }
}
