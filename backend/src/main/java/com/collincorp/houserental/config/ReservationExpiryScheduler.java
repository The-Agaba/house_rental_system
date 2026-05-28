package com.collincorp.houserental.config;

import com.collincorp.houserental.service.ReservationService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ReservationExpiryScheduler {

    private final ReservationService reservationService;

    public ReservationExpiryScheduler(ReservationService reservationService) {
        this.reservationService = reservationService;
    }

    // Runs every 60 seconds (60000 ms)
    @Scheduled(fixedRate = 60000)
    public void checkExpiredReservations() {
        reservationService.processExpiredReservations();
    }
}
