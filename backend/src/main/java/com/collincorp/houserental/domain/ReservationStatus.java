package com.collincorp.houserental.domain;

public enum ReservationStatus {
    queued,             // In the FCFS queue, waiting for turn
    awaiting_confirmation, // User's turn — has 24hrs to confirm
    confirmed,          // User confirmed within deadline
    expired,            // 24hr window passed without confirmation
    cancelled,          // Cancelled by user or system
    accepted            // Landlord accepted this reservation (final)
}
