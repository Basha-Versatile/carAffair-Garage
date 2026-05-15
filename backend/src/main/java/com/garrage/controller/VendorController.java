package com.garrage.controller;

import com.garrage.dto.request.CreateVendorRequest;
import com.garrage.dto.request.RegisterVendorRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Vendor;
import com.garrage.security.TenantContext;
import com.garrage.service.VendorService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vendors")
@RequiredArgsConstructor
public class VendorController {

    private final VendorService vendorService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Vendor>>> getVendors() {
        List<Vendor> vendors = vendorService.getVendors(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(vendors));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Vendor>> createVendor(@Valid @RequestBody CreateVendorRequest request) {
        Vendor vendor = vendorService.createVendor(request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(vendor));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Vendor>> registerVendor(@Valid @RequestBody RegisterVendorRequest request) {
        Vendor vendor = vendorService.registerVendor(request);
        return ResponseEntity.ok(ApiResponse.ok(vendor));
    }

    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<Vendor>> approveVendor(@PathVariable String id) {
        Vendor vendor = vendorService.approveVendor(id);
        return ResponseEntity.ok(ApiResponse.ok(vendor));
    }

    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<Vendor>> rejectVendor(@PathVariable String id) {
        Vendor vendor = vendorService.rejectVendor(id);
        return ResponseEntity.ok(ApiResponse.ok(vendor));
    }

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<Vendor>>> getPendingVendors() {
        List<Vendor> vendors = vendorService.getPendingVendors();
        return ResponseEntity.ok(ApiResponse.ok(vendors));
    }
}
