package com.garrage.service;

import com.garrage.exception.BadRequestException;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Brand;
import com.garrage.model.BrandRequest;
import com.garrage.repository.BrandRepository;
import com.garrage.repository.BrandRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class BrandRequestService {

    private final BrandRequestRepository brandRequestRepository;
    private final BrandRepository brandRepository;
    private final NotificationService notificationService;

    /**
     * Garage admin submits a new brand request.
     * Creates the brand immediately (without logo) so it can be used in order creation.
     */
    public BrandRequest submitBrandRequest(String brandName, String garageId,
                                            String garageName, String userId) {
        String trimmed = brandName.trim();

        if (brandRepository.findByNameIgnoreCase(trimmed).isPresent()) {
            throw new BadRequestException("Brand '" + trimmed + "' already exists.");
        }

        if (brandRequestRepository.existsByNameIgnoreCaseAndStatusNot(trimmed, "REJECTED")) {
            throw new BadRequestException("A request for brand '" + trimmed + "' is already pending.");
        }

        // Create brand immediately (no logo) so brandId is valid for order creation
        Brand brand = Brand.builder().name(trimmed).build();
        brand = brandRepository.save(brand);

        BrandRequest request = BrandRequest.builder()
                .name(trimmed)
                .garageId(garageId)
                .garageName(garageName)
                .requestedByUserId(userId)
                .approvedBrandId(brand.getId())
                .status("PENDING")
                .build();

        request = brandRequestRepository.save(request);
        log.info("Brand request submitted: {} by garage {} (id: {})", trimmed, garageName, request.getId());

        notificationService.notifySuperAdmin(
                "BRAND_REQUEST", "SYSTEM", "normal",
                "New Brand Request",
                "Garage \"" + garageName + "\" requests new brand: " + trimmed,
                "/dashboard/super-admin/brand-requests",
                "BRAND_REQUEST", request.getId());

        return request;
    }

    public List<BrandRequest> getAllBrandRequests() {
        return brandRequestRepository.findAllByOrderByCreatedAtDesc();
    }

    public BrandRequest getBrandRequestById(String id) {
        return brandRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Brand request not found: " + id));
    }

    /**
     * Super admin approves: assigns logo to the pre-created brand.
     */
    public BrandRequest approveBrandRequest(String id, String logoFileId) {
        BrandRequest request = getBrandRequestById(id);

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException("Only pending requests can be approved.");
        }

        // Update the existing brand with the logo
        Brand brand = brandRepository.findById(request.getApprovedBrandId())
                .orElseThrow(() -> new ResourceNotFoundException("Associated brand not found"));
        brand.setLogoFileId(logoFileId);
        brandRepository.save(brand);

        request.setStatus("APPROVED");
        request.setLogoFileId(logoFileId);
        brandRequestRepository.save(request);

        log.info("Brand request approved: {} -> brand id {}", request.getName(), brand.getId());
        return request;
    }

    /**
     * Super admin rejects. Brand stays in collection since orders may reference it.
     */
    public void rejectBrandRequest(String id, String reason) {
        BrandRequest request = getBrandRequestById(id);

        if (!"PENDING".equals(request.getStatus())) {
            throw new BadRequestException("Only pending requests can be rejected.");
        }

        request.setStatus("REJECTED");
        request.setRejectionReason(reason);
        brandRequestRepository.save(request);

        log.info("Brand request rejected: {} (id: {})", request.getName(), request.getId());
    }
}
