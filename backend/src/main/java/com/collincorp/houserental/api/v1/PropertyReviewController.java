package com.collincorp.houserental.api.v1;

import com.collincorp.houserental.dto.PropertyReviewRequest;
import com.collincorp.houserental.dto.PropertyReviewResponse;
import com.collincorp.houserental.dto.ReviewEligibilityResponse;
import com.collincorp.houserental.service.PropertyReviewService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/properties/{propertyId}/reviews")
public class PropertyReviewController {

    private final PropertyReviewService propertyReviewService;

    public PropertyReviewController(PropertyReviewService propertyReviewService) {
        this.propertyReviewService = propertyReviewService;
    }

    @GetMapping
    public List<PropertyReviewResponse> list(@PathVariable long propertyId) {
        return propertyReviewService.listForProperty(propertyId);
    }

    @GetMapping("/eligibility")
    public ReviewEligibilityResponse eligibility(@PathVariable long propertyId) {
        return propertyReviewService.getEligibility(propertyId);
    }

    @PostMapping
    public PropertyReviewResponse submit(
            @PathVariable long propertyId,
            @Valid @RequestBody PropertyReviewRequest request) {
        return propertyReviewService.submit(propertyId, request);
    }
}
