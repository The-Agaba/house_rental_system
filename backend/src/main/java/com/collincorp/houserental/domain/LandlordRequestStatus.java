package com.collincorp.houserental.domain;

public enum LandlordRequestStatus {
    pending,      // Landlord submitted join request, awaiting agent assignment
    assigned,     // Agent assigned, awaiting document verification
    verified,     // Documents verified, landlord account being created
    approved,     // Landlord fully onboarded
    rejected      // Request denied
}
