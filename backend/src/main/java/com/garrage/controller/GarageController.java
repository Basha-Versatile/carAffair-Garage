package com.garrage.controller;

import java.io.IOException;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.garrage.dto.request.CreateGarageRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.GarageResponse;
import com.garrage.exception.UnauthorizedException;
import com.garrage.security.UserPrincipal;
import com.garrage.service.GarageService;
import com.garrage.service.ImageStorageService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/garages")
@RequiredArgsConstructor
public class GarageController {

    private final GarageService garageService;
    private final ImageStorageService imageStorageService;

    /**
     * GET /api/garages
     * List all garages. Restricted to super_admin only.
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<GarageResponse>>> getAllGarages() {
        requireRole("super_admin");
        List<GarageResponse> garages = garageService.getAllGarages();
        return ResponseEntity.ok(ApiResponse.ok(garages));
    }

    /**
     * POST /api/garages
     * Create a new garage. Restricted to super_admin only.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<GarageResponse>> createGarage(
            @Valid @RequestBody CreateGarageRequest request) {
        requireRole("super_admin");
        GarageResponse garage = garageService.createGarage(request);
        return ResponseEntity.ok(ApiResponse.ok(garage));
    }

    /**
     * GET /api/garages/{id}
     * Get garage detail by id.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageResponse>> getGarageById(@PathVariable String id) {
        GarageResponse garage = garageService.getGarageById(id);
        return ResponseEntity.ok(ApiResponse.ok(garage));
    }

    /**
     * PUT /api/garages/{id}
     * Update an existing garage.
     */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageResponse>> updateGarage(
            @PathVariable String id,
            @Valid @RequestBody CreateGarageRequest request) {
        GarageResponse garage = garageService.updateGarage(id, request);
        return ResponseEntity.ok(ApiResponse.ok(garage));
    }

    /**
     * GET /api/garages/{id}/dashboard
     * Get dashboard stats for a garage.
     */
    @GetMapping("/{id}/dashboard")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getGarageDashboard(
            @PathVariable String id) {
        Map<String, Object> dashboard = garageService.getGarageDashboard(id);
        return ResponseEntity.ok(ApiResponse.ok(dashboard));
    }

    /**
     * GET /api/garages/stats
     * Get platform-wide stats for the super admin dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSuperAdminStats() {
        requireRole("super_admin");
        Map<String, Object> stats = garageService.getSuperAdminStats();
        return ResponseEntity.ok(ApiResponse.ok(stats));
    }

    /**
     * PUT /api/garages/{id}/toggle-active
     * Toggle active status for a garage. Restricted to super_admin only.
     */
    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<GarageResponse>> toggleGarageActive(@PathVariable String id) {
        requireRole("super_admin");
        GarageResponse garage = garageService.toggleGarageActive(id);
        return ResponseEntity.ok(ApiResponse.ok(garage));
    }

    /**
     * POST /api/garages/{id}/logo
     * Upload a logo for a garage.
     */
    @PostMapping("/{id}/logo")
    public ResponseEntity<ApiResponse<GarageResponse>> uploadGarageLogo(
            @PathVariable String id,
            @RequestParam("file") MultipartFile file) throws IOException {
        List<String> fileIds = imageStorageService.storeImages(List.of(file), id, "garage-logo");
        GarageResponse garage = garageService.updateGarageLogo(id, fileIds.get(0));
        return ResponseEntity.ok(ApiResponse.ok(garage));
    }

    // ---- Private helpers ----

    /**
     * Manual role check since method-level security is not enabled.
     * Verifies the currently authenticated user has the required role.
     */
    private void requireRole(String role) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getPrincipal() == null) {
            throw new UnauthorizedException("Not authenticated");
        }

        Object principal = authentication.getPrincipal();
        if (!(principal instanceof UserPrincipal)) {
            throw new UnauthorizedException("Not authenticated");
        }

        UserPrincipal userPrincipal = (UserPrincipal) principal;
        if (!role.equals(userPrincipal.getRole())) {
            throw new UnauthorizedException("Access denied. Required role: " + role);
        }
    }
}
