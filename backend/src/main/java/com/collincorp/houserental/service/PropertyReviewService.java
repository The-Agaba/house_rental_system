package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.NotificationType;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.PropertyReviewRequest;
import com.collincorp.houserental.dto.PropertyReviewResponse;
import com.collincorp.houserental.dto.ReviewEligibilityResponse;
import com.collincorp.houserental.entity.BookingEntity;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.PropertyReviewEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.BookingRepository;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.repository.PropertyReviewRepository;
import com.collincorp.houserental.support.SecurityUtils;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class PropertyReviewService {

    private static final int MAX_COMMENT_LENGTH = 1000;
    private static final Pattern HTML_TAGS = Pattern.compile("<[^>]*>");
    private static final Pattern CONTROL_CHARS = Pattern.compile("[\\p{Cntrl}&&[^\r\n\t]]");

    private final PropertyReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final PropertyRepository propertyRepository;
    private final NotificationService notificationService;
    private final LogService logService;

    @Value("${app.homepage-url:http://localhost:5173}")
    private String homepageUrl;

    public PropertyReviewService(
            PropertyReviewRepository reviewRepository,
            BookingRepository bookingRepository,
            PropertyRepository propertyRepository,
            NotificationService notificationService,
            LogService logService) {
        this.reviewRepository = reviewRepository;
        this.bookingRepository = bookingRepository;
        this.propertyRepository = propertyRepository;
        this.notificationService = notificationService;
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public List<PropertyReviewResponse> listForProperty(long propertyId) {
        return reviewRepository.findAllForProperty(propertyId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public ReviewEligibilityResponse getEligibility(long propertyId) {
        UserEntity user = SecurityUtils.currentUser();
        if (user.getRole() != UserRole.tenant) {
            return new ReviewEligibilityResponse(false, false, null, "tenant_only");
        }

        LocalDate today = LocalDate.now();
        List<BookingEntity> eligibleBookings = bookingRepository.findReviewEligibleBookings(propertyId, user.getId(), today);
        if (!eligibleBookings.isEmpty()) {
            return new ReviewEligibilityResponse(true, false, eligibleBookings.getFirst().getId(), null);
        }

        boolean hasCompletedRental = !bookingRepository.findCompletedRentalRecords(propertyId, user.getId(), today).isEmpty();
        boolean alreadyReviewed = hasCompletedRental && reviewRepository.existsByPropertyIdAndTenantId(propertyId, user.getId());
        return new ReviewEligibilityResponse(false, alreadyReviewed, null,
                alreadyReviewed ? "already_reviewed" : "completed_rental_required");
    }

    @Transactional
    public PropertyReviewResponse submit(long propertyId, PropertyReviewRequest request) {
        UserEntity tenant = SecurityUtils.currentUser();
        if (tenant.getRole() != UserRole.tenant) {
            throw new ApiException(HttpStatus.FORBIDDEN, "tenant_only");
        }
        if (request.rating() < 1 || request.rating() > 5) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "rating_must_be_between_1_and_5");
        }

        List<BookingEntity> eligibleBookings = bookingRepository.findReviewEligibleBookings(propertyId, tenant.getId(), LocalDate.now());
        if (eligibleBookings.isEmpty()) {
            throw new ApiException(HttpStatus.FORBIDDEN, "completed_rental_required");
        }

        BookingEntity booking = eligibleBookings.getFirst();
        if (reviewRepository.existsByBookingId(booking.getId())) {
            throw new ApiException(HttpStatus.CONFLICT, "review_already_submitted");
        }

        PropertyEntity property = booking.getProperty();
        if (!property.getId().equals(propertyId)) {
            throw new ApiException(HttpStatus.FORBIDDEN, "review_property_mismatch");
        }

        PropertyReviewEntity review = new PropertyReviewEntity();
        review.setBooking(booking);
        review.setProperty(property);
        review.setTenant(tenant);
        review.setLandlord(property.getLandlord());
        review.setRating(request.rating());
        review.setComment(sanitizeComment(request.comment()));
        review.setVerifiedRentalReview(true);
        review.setCreatedAt(Instant.now());

        PropertyReviewEntity saved = reviewRepository.save(review);
        recalculatePropertyRating(property.getId());
        notifyLandlord(saved);
        logService.log(LogAction.REVIEW_SUBMITTED, "property_review", saved.getId(), tenant.getId(), tenant.getEmail(),
                "Verified rental review submitted for property: " + property.getTitle());
        return toResponse(saved);
    }

    @Transactional
    public void sendLeaseEndFeedbackRequests() {
        LocalDate today = LocalDate.now();
        List<BookingEntity> bookings = bookingRepository.findBookingsEndingTodayWithoutFeedbackEmail(today);
        for (BookingEntity booking : bookings) {
            if (reviewRepository.existsByBookingId(booking.getId())) {
                booking.setFeedbackEmailSentAt(Instant.now());
                continue;
            }

            PropertyEntity property = booking.getProperty();
            String link = trimTrailingSlash(homepageUrl) + "/properties/" + property.getId() + "?review=1";
            String message = "Thank you for using RentHub.\n\n"
                    + "Your rental at " + property.getTitle() + " ends today. We would appreciate your feedback about the experience.\n\n"
                    + "Open the property page to leave your verified rental review:\n"
                    + link + "\n\n"
                    + "Only completed RentHub tenants can submit reviews, and your feedback helps future tenants make informed decisions.";

            notificationService.sendNotification(
                    booking.getTenant().getId(),
                    NotificationType.REVIEW_REQUEST,
                    "Tell us about your rental experience",
                    message,
                    property.getId());
            booking.setFeedbackEmailSentAt(Instant.now());
            logService.log(LogAction.REVIEW_REQUEST_SENT, "booking", booking.getId(), booking.getTenant().getId(),
                    booking.getTenant().getEmail(), "Feedback request sent for property: " + property.getTitle());
        }
    }

    private void recalculatePropertyRating(Long propertyId) {
        Object[] stats = reviewRepository.calculateStats(propertyId).orElse(new Object[] {0L, BigDecimal.ZERO});
        long count = ((Number) stats[0]).longValue();
        BigDecimal average = stats[1] == null
                ? BigDecimal.ZERO
                : new BigDecimal(stats[1].toString()).setScale(2, RoundingMode.HALF_UP);

        PropertyEntity property = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        property.setReviewCount(count);
        property.setAverageRating(average);
        propertyRepository.save(property);
    }

    private void notifyLandlord(PropertyReviewEntity review) {
        PropertyEntity property = review.getProperty();
        String submittedAt = DateTimeFormatter.ISO_OFFSET_DATE_TIME.format(review.getCreatedAt().atZone(ZoneId.systemDefault()));
        String commentLine = StringUtils.hasText(review.getComment())
                ? "\nComment: " + review.getComment()
                : "\nComment: No comment provided";
        String message = "A verified tenant review was submitted for " + property.getTitle() + ".\n\n"
                + "Rating: " + review.getRating() + " / 5"
                + commentLine
                + "\nSubmission date: " + submittedAt;

        notificationService.sendNotification(
                review.getLandlord().getId(),
                NotificationType.REVIEW_SUBMITTED,
                "New verified review for " + property.getTitle(),
                message,
                property.getId());
    }

    private String sanitizeComment(String comment) {
        if (!StringUtils.hasText(comment)) {
            return null;
        }
        String cleaned = CONTROL_CHARS.matcher(comment).replaceAll("").trim();
        cleaned = HTML_TAGS.matcher(cleaned).replaceAll("").trim();
        if (cleaned.length() > MAX_COMMENT_LENGTH) {
            cleaned = cleaned.substring(0, MAX_COMMENT_LENGTH).trim();
        }
        return cleaned.isBlank() ? null : cleaned;
    }

    private PropertyReviewResponse toResponse(PropertyReviewEntity review) {
        UserEntity tenant = review.getTenant();
        return new PropertyReviewResponse(
                review.getId(),
                review.getProperty().getId(),
                tenant.getId(),
                StringUtils.hasText(tenant.getFullName()) ? tenant.getFullName() : tenant.getEmail(),
                review.getLandlord().getId(),
                review.getBooking().getId(),
                review.getRating(),
                review.getComment(),
                review.isVerifiedRentalReview(),
                review.getCreatedAt());
    }

    private static String trimTrailingSlash(String value) {
        if (value == null || value.isBlank()) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}
