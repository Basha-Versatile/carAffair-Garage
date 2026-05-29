package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.BrandRequest;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.BrandRequestService;
import com.garrage.service.ImageStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/brand-requests")
@RequiredArgsConstructor
public class BrandRequestController {

    private final BrandRequestService brandRequestService;
    private final ImageStorageService imageStorageService;

    /** Garage admin submits a new brand request. */
    @PostMapping
    public ResponseEntity<ApiResponse<BrandRequest>> submitRequest(
            @RequestBody Map<String, String> body) {
        String brandName = body.get("name");
        String garageId = TenantContext.getGarageId();

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
        String userId = principal.getId();
        String garageName = principal.getGarageName() != null ? principal.getGarageName() : "Unknown";

        BrandRequest request = brandRequestService.submitBrandRequest(
                brandName, garageId, garageName, userId);
        return ResponseEntity.ok(ApiResponse.ok(request));
    }

    /** Super admin lists all brand requests. */
    @GetMapping
    public ResponseEntity<ApiResponse<List<BrandRequest>>> getAllRequests() {
        List<BrandRequest> requests = brandRequestService.getAllBrandRequests();
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    /** Super admin views a single request. */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BrandRequest>> getById(@PathVariable String id) {
        BrandRequest request = brandRequestService.getBrandRequestById(id);
        return ResponseEntity.ok(ApiResponse.ok(request));
    }

    /** Super admin approves with optional logo upload. */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approve(
            @PathVariable String id,
            @RequestParam(value = "logo", required = false) MultipartFile logo) throws IOException {
        String logoFileId = null;
        if (logo != null && !logo.isEmpty()) {
            logoFileId = imageStorageService.storeImage(logo, "system", "brand-logo");
        }
        brandRequestService.approveBrandRequest(id, logoFileId);
        return ResponseEntity.ok(ApiResponse.okMessage("Brand request approved."));
    }

    /** Super admin rejects with optional reason. */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> reject(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        brandRequestService.rejectBrandRequest(id, reason);
        return ResponseEntity.ok(ApiResponse.okMessage("Brand request rejected."));
    }
}
