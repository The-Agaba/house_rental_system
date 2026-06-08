package com.collincorp.houserental.api.v1;

import java.util.List;
import com.collincorp.houserental.domain.PropertyAvailability;
import com.collincorp.houserental.dto.PagedResponse;
import com.collincorp.houserental.dto.PropertyCreateRequest;
import com.collincorp.houserental.dto.PropertyImageResponse;
import com.collincorp.houserental.dto.PropertyResponse;
import com.collincorp.houserental.dto.PropertyUpdateRequest;
import com.collincorp.houserental.service.PropertyService;
import com.collincorp.houserental.support.SecurityUtils;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/properties")
public class PropertyController {

    private final PropertyService propertyService;

    public PropertyController(PropertyService propertyService) {
        this.propertyService = propertyService;
    }

    @GetMapping("/my")
    public List<PropertyResponse> listMine() {
        return propertyService.listMine();
    }

    @GetMapping("/my-locality")
    public List<PropertyResponse> listByLocality() {
        return propertyService.listByAgentLocality(SecurityUtils.currentUser().getLocality());
    }

    @GetMapping
    public PagedResponse<PropertyResponse> list(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Integer minRooms,
            @RequestParam(required = false) PropertyAvailability availability,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        Page<PropertyResponse> result = propertyService.search(location, maxPrice, minRooms, availability, pageable);
        return new PagedResponse<>(
                result.getContent(),
                result.getTotalElements(),
                result.getTotalPages(),
                result.getNumber(),
                result.getSize());
    }

    @GetMapping("/{id}")
    public PropertyResponse get(@PathVariable long id) {
        return propertyService.get(id);
    }

    @PostMapping
    public PropertyResponse create(@Valid @RequestBody PropertyCreateRequest request) {
        return propertyService.create(request);
    }

    @PutMapping("/{id}")
    public PropertyResponse update(@PathVariable long id, @Valid @RequestBody PropertyUpdateRequest request) {
        return propertyService.update(id, request);
    }

    @PutMapping("/{id}/approve")
    public PropertyResponse approve(@PathVariable long id, @RequestParam boolean approved) {
        return propertyService.approve(id, approved);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable long id) {
        propertyService.delete(id);
    }

    @PostMapping(value = "/{id}/images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public List<PropertyImageResponse> uploadImages(@PathVariable long id,
            @RequestPart("files") List<MultipartFile> files) {
        return propertyService.addImages(id, files);
    }
}
