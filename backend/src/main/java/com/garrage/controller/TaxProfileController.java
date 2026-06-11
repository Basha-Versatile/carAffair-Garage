package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.TaxProfile;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.TaxProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tax-profiles")
@RequiredArgsConstructor
public class TaxProfileController {

    private final TaxProfileService taxProfileService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TaxProfile>>> getProfiles(
            @RequestParam(required = false) String type) {
        PermissionChecker.require("SETTINGS:VIEW");
        String garageId = TenantContext.getGarageId();
        List<TaxProfile> profiles;
        if (type != null && !type.isBlank()) {
            profiles = taxProfileService.getProfilesByType(garageId, type);
        } else {
            profiles = taxProfileService.getProfiles(garageId);
        }
        return ResponseEntity.ok(ApiResponse.ok(profiles));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<TaxProfile>> createProfile(@RequestBody TaxProfile profile) {
        PermissionChecker.require("SETTINGS:MANAGE");
        TaxProfile created = taxProfileService.createProfile(profile, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
