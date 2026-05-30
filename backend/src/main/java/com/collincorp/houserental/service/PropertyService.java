package com.collincorp.houserental.service;

import com.collincorp.houserental.api.ApiException;
import com.collincorp.houserental.domain.LogAction;
import com.collincorp.houserental.domain.PropertyAvailability;
import com.collincorp.houserental.domain.UserRole;
import com.collincorp.houserental.dto.PropertyCreateRequest;
import com.collincorp.houserental.dto.PropertyImageResponse;
import com.collincorp.houserental.dto.PropertyResponse;
import com.collincorp.houserental.dto.PropertyUpdateRequest;
import com.collincorp.houserental.entity.PropertyEntity;
import com.collincorp.houserental.entity.PropertyImageEntity;
import com.collincorp.houserental.entity.UserEntity;
import com.collincorp.houserental.repository.PropertyRepository;
import com.collincorp.houserental.support.SecurityUtils;
import jakarta.persistence.criteria.Predicate;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

@Service
public class PropertyService {

    private final PropertyRepository propertyRepository;
    private final com.collincorp.houserental.repository.PropertyImageRepository propertyImageRepository;
    private final StorageService storageService;
    private final BookingService bookingService;
    private final LogService logService;

    public PropertyService(PropertyRepository propertyRepository, 
                           com.collincorp.houserental.repository.PropertyImageRepository propertyImageRepository,
                           StorageService storageService, 
                           BookingService bookingService, 
                           LogService logService) {
        this.propertyRepository = propertyRepository;
        this.propertyImageRepository = propertyImageRepository;
        this.storageService = storageService;
        this.bookingService = bookingService;
        this.logService = logService;
    }

    @Transactional(readOnly = true)
    public List<PropertyResponse> listMine() {
        UserEntity u = SecurityUtils.currentUser();
        return propertyRepository.findAllByLandlordIdOrderByIdDesc(u.getId()).stream()
                .map(p -> toResponse(p, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public Page<PropertyResponse> search(
            String location,
            BigDecimal maxPrice,
            Integer minRooms,
            PropertyAvailability availability,
            Pageable pageable) {

        UserEntity user = currentUserOrNull();
        boolean isAdmin = user != null && user.getRole() == UserRole.admin;
        boolean canManageListings = user != null && (user.getRole() == UserRole.admin || user.getRole() == UserRole.agent);

        Specification<PropertyEntity> spec = buildSpec(location, maxPrice, minRooms, availability, isAdmin);
        return propertyRepository.findAll(spec, pageable)
                .map(p -> toResponse(p, canManageListings || isOwner(p, user)));
    }

    @Transactional(readOnly = true)
    public PropertyResponse get(long id) {
        PropertyEntity p = propertyRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        if (!p.isApproved()) {
            try {
                UserEntity user = SecurityUtils.currentUser();
                boolean admin = user.getRole() == UserRole.admin;
                boolean owner = p.getLandlord().getId().equals(user.getId());
                if (!admin && !owner) {
                    throw new ApiException(HttpStatus.NOT_FOUND, "property_not_found");
                }
            } catch (ApiException ex) {
                if (ex.getStatus() == HttpStatus.UNAUTHORIZED) {
                    throw new ApiException(HttpStatus.NOT_FOUND, "property_not_found");
                }
                throw ex;
            }
        }
        UserEntity user = currentUserOrNull();
        return toResponse(p, canViewContactDetails(p, user));
    }

    @Transactional
    public PropertyResponse create(PropertyCreateRequest req) {
        UserEntity user = SecurityUtils.currentUser();
        if (user.getRole() != UserRole.admin && user.getRole() != UserRole.agent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "landlord_role_required");
        }
        PropertyEntity p = new PropertyEntity();
        p.setLandlord(user);
        p.setTitle(req.title());
        p.setDescription(req.description());
        p.setLocation(req.location());
        p.setPricePerMonth(req.pricePerMonth());
        p.setRooms(req.rooms());
        p.setAvailability(req.availability() != null ? req.availability() : PropertyAvailability.available);
        p.setPhone(req.phone());
        p.setContactEmail(req.contactEmail());
        p.setApproved(true);
        p.setNeedsImages(true);
        if (user.getRole() == UserRole.agent) {
            p.setRegisteredByAgent(user);
        }
        PropertyEntity saved = propertyRepository.save(p);
        logService.log(LogAction.PROPERTY_CREATED, "property", saved.getId(), "Created property listing: " + saved.getTitle());
        return toResponse(saved, true);
    }

    @Transactional
    public PropertyResponse update(long id, PropertyUpdateRequest req) {
        PropertyEntity p = propertyRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        assertOwnerOrAdmin(p);
        if (req.title() != null) {
            p.setTitle(req.title());
        }
        if (req.description() != null) {
            p.setDescription(req.description());
        }
        if (req.location() != null) {
            p.setLocation(req.location());
        }
        if (req.pricePerMonth() != null) {
            p.setPricePerMonth(req.pricePerMonth());
        }
        if (req.rooms() != null) {
            p.setRooms(req.rooms());
        }
        if (req.availability() != null) {
            p.setAvailability(req.availability());
        }
        if (req.phone() != null) {
            p.setPhone(req.phone());
        }
        if (req.contactEmail() != null) {
            p.setContactEmail(req.contactEmail());
        }
        if (SecurityUtils.currentUser().getRole() != UserRole.admin && SecurityUtils.currentUser().getRole() != UserRole.agent) {
            p.setApproved(false);
        }
        PropertyEntity saved = propertyRepository.save(p);
        logService.log(LogAction.PROPERTY_UPDATED, "property", saved.getId(), "Updated property listing details: " + saved.getTitle());
        return toResponse(saved, true);
    }

    @Transactional
    public void delete(long id) {
        PropertyEntity p = propertyRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        assertOwnerOrAdmin(p);
        String title = p.getTitle();
        propertyRepository.delete(p);
        logService.log(LogAction.PROPERTY_DELETED, "property", id, "Deleted property listing: " + title);
    }

    @Transactional
    public PropertyResponse approve(long id, boolean approved) {
        UserEntity user = SecurityUtils.currentUser();
        if (user.getRole() != UserRole.admin && user.getRole() != UserRole.agent) {
            throw new ApiException(HttpStatus.FORBIDDEN, "admin_or_agent_only");
        }
        PropertyEntity p = propertyRepository
                .findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        p.setApproved(approved);
        PropertyEntity saved = propertyRepository.save(p);
        logService.log(LogAction.PROPERTY_UPDATED, "property", saved.getId(), "Admin/agent updated approval status to " + approved + " for property: " + saved.getTitle());
        return toResponse(saved, true);
    }

    @Transactional
    public List<PropertyImageResponse> addImages(long propertyId, List<MultipartFile> files) {
        PropertyEntity p = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        assertOwnerOrAdmin(p);

        List<PropertyImageResponse> responses = new ArrayList<>();
        for (MultipartFile file : files) {
            String path = storageService.store(file);
            PropertyImageEntity img = new PropertyImageEntity();
            img.setFilePath(path);
            img.setProperty(p);
            img = propertyImageRepository.save(img);
            p.getImages().add(img);
            responses.add(new PropertyImageResponse(img.getId(), img.getFilePath()));
        }

        if (!responses.isEmpty()) {
            p.setNeedsImages(false);
            propertyRepository.save(p);
        }

        return responses;
    }

    @Transactional
    public PropertyImageResponse addImage(long propertyId, MultipartFile file) {
        PropertyEntity p = propertyRepository
                .findById(propertyId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "property_not_found"));
        assertOwnerOrAdmin(p);
        String path = storageService.store(file);
        PropertyImageEntity img = new PropertyImageEntity();
        img.setFilePath(path);
        img.setProperty(p);
        img = propertyImageRepository.save(img);
        p.getImages().add(img);
        
        p.setNeedsImages(false);
        propertyRepository.save(p);

        return new PropertyImageResponse(img.getId(), img.getFilePath());
    }

    private void assertOwnerOrAdmin(PropertyEntity p) {
        UserEntity u = SecurityUtils.currentUser();
        if (u.getRole() == UserRole.admin || u.getRole() == UserRole.agent) {
            return;
        }
        if (u.getRole() != UserRole.landlord || !p.getLandlord().getId().equals(u.getId())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "not_property_owner");
        }
    }

    private PropertyResponse toResponse(PropertyEntity p) {
        return toResponse(p, true);
    }

    private PropertyResponse toResponse(PropertyEntity p, boolean includeContactDetails) {
        List<PropertyImageResponse> imgs = p.getImages().stream()
                .map(i -> new PropertyImageResponse(i.getId(), i.getFilePath()))
                .toList();
        long bookingCount = bookingService.countByProperty(p.getId());
        return new PropertyResponse(
                p.getId(),
                p.getLandlord().getId(),
                includeContactDetails ? p.getLandlord().getEmail() : null,
                p.getTitle(),
                p.getDescription(),
                p.getLocation(),
                p.getPricePerMonth(),
                p.getRooms(),
                p.getAvailability().name(),
                p.isApproved(),
                p.getCreatedAt(),
                imgs,
                includeContactDetails ? p.getPhone() : null,
                includeContactDetails ? p.getContactEmail() : null,
                bookingCount,
                p.isNeedsImages(),
                p.getRegisteredByAgent() != null ? p.getRegisteredByAgent().getId() : null);
    }

    private UserEntity currentUserOrNull() {
        try {
            return SecurityUtils.currentUser();
        } catch (Exception e) {
            return null;
        }
    }

    private boolean canViewContactDetails(PropertyEntity p, UserEntity user) {
        if (user == null) {
            return false;
        }
        return user.getRole() == UserRole.admin
                || user.getRole() == UserRole.agent
                || isOwner(p, user);
    }

    private boolean isOwner(PropertyEntity p, UserEntity user) {
        return user != null
                && user.getRole() == UserRole.landlord
                && p.getLandlord().getId().equals(user.getId());
    }

    private static Specification<PropertyEntity> buildSpec(
            String location, BigDecimal maxPrice, Integer minRooms, PropertyAvailability availability, boolean isAdmin) {
        return (root, query, cb) -> {
            List<Predicate> parts = new ArrayList<>();
            if (StringUtils.hasText(location)) {
                parts.add(cb.like(cb.lower(root.get("location")), "%" + location.trim().toLowerCase() + "%"));
            }
            if (maxPrice != null) {
                parts.add(cb.lessThanOrEqualTo(root.get("pricePerMonth"), maxPrice));
            }
            if (minRooms != null) {
                parts.add(cb.greaterThanOrEqualTo(root.get("rooms"), minRooms));
            }
            if (availability != null) {
                parts.add(cb.equal(root.get("availability"), availability));
            }
            if (!isAdmin) {
                parts.add(cb.equal(root.get("approved"), true));
            }
            if (parts.isEmpty()) {
                return cb.conjunction();
            }
            return cb.and(parts.toArray(Predicate[]::new));
        };
    }
}
