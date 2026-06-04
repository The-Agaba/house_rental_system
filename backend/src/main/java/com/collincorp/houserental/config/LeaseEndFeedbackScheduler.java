package com.collincorp.houserental.config;

import com.collincorp.houserental.service.PropertyReviewService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class LeaseEndFeedbackScheduler {

    private final PropertyReviewService propertyReviewService;

    public LeaseEndFeedbackScheduler(PropertyReviewService propertyReviewService) {
        this.propertyReviewService = propertyReviewService;
    }

    @Scheduled(cron = "0 0 9 * * *")
    public void sendLeaseEndFeedbackRequests() {
        propertyReviewService.sendLeaseEndFeedbackRequests();
    }
}
