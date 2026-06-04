package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.FavoriteRequest;
import com.collincorp.houserental.dto.PropertyResponse;
import com.collincorp.houserental.entity.FavoriteEntity;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.FavoriteRepository;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.support.SecurityUtils;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FavoriteService {

    private final FavoriteRepository favoriteRepository;
    private final PropertyRepository propertyRepository;
    private final BookingService bookingService;

    public FavoriteService(FavoriteRepository favoriteRepository, PropertyRepository propertyRepository, BookingService bookingService) {
        this.favoriteRepository = favoriteRepository;
        this.propertyRepository = propertyRepository;
        this.bookingService = bookingService;
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> list() {
        UserEntity u = SecurityUtils.currentUser();
        if (u.getRole() != UserRole.tenant && u.getRole() != UserRole.admin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "tenant_role_required");
        }
        return favoriteRepository.findByUserId(u.getId()).stream()
                .map(FavoriteEntity::getProperty)
                .map(this::toPropertyResponse)
                .toList();
    }

    @Transactional
    public void add(FavoriteRequest req) {
        UserEntity u = SecurityUtils.currentUser();
        if (u.getRole() != UserRole.tenant && u.getRole() != UserRole.admin) {
            throw new ApiException(HttpStatus.FORBIDDEN, "tenant_role_required");
        }
        PropertyEntity p = propertyRepository
                .findById(req.propertyId())
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        if (favoriteRepository.findByUser_IdAndProperty_Id(u.getId(), p.getId()).isPresent()) {
            return;
        }
        FavoriteEntity f = new FavoriteEntity();
        f.setUser(u);
        f.setProperty(p);
        favoriteRepository.save(f);
    }

    @Transactional
    public void remove(long propertyId) {
        UserEntity u = SecurityUtils.currentUser();
        favoriteRepository.deleteByUser_IdAndProperty_Id(u.getId(), propertyId);
    }

    private PropertyResponse toPropertyResponse(PropertyEntity p) {
        var imgs = p.getImages().stream()
                .map(i -> new com.collincorp.houserental.dto.PropertyImageResponse(i.getId(), i.getFilePath()))
                .toList();
        long bookingCount = bookingService.countByProperty(p.getId());
        return new PropertyResponse(
                p.getId(),
                p.getLandlord().getId(),
                p.getLandlord().getEmail(),
                p.getTitle(),
                p.getDescription(),
                p.getLocation(),
                p.getPricePerMonth(),
                p.getRooms(),
                p.getAvailability().name(),
                p.isApproved(),
                p.getCreatedAt(),
                imgs,
                p.getPhone(),
                p.getContactEmail(),
                bookingCount,
                p.getAverageRating(),
                p.getReviewCount(),
                p.isNeedsImages(),
                p.getRegisteredByAgent() != null ? p.getRegisteredByAgent().getId() : null);
    }
}
