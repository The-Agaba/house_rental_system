package com.collincorp.houserental.domain;

public enum ReservationStatus {
    pending_landlord_confirmation,
    confirmed,
    expired,
    cancelled,
    declined,
    accepted,

    // Legacy statuses kept so existing database rows can still be read.
    queued,
    awaiting_confirmation
}
