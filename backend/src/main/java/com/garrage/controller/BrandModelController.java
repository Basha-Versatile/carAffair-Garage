package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Brand;
import com.garrage.model.VehicleModel;
import com.garrage.service.BrandModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BrandModelController {

    private final BrandModelService brandModelService;

    @GetMapping("/api/brands")
    public ResponseEntity<ApiResponse<List<Brand>>> getAllBrands() {
        List<Brand> brands = brandModelService.getAllBrands();
        return ResponseEntity.ok(ApiResponse.ok(brands));
    }

    @GetMapping("/api/models")
    public ResponseEntity<ApiResponse<List<VehicleModel>>> getModels(
            @RequestParam(required = false) String brandId) {
        List<VehicleModel> models;
        if (brandId != null && !brandId.isBlank()) {
            models = brandModelService.getModelsByBrand(brandId);
        } else {
            models = brandModelService.getAllModels();
        }
        return ResponseEntity.ok(ApiResponse.ok(models));
    }

    @PostMapping("/api/models")
    public ResponseEntity<ApiResponse<VehicleModel>> addModel(@RequestBody Map<String, String> body) {
        String brandId = body.get("brandId");
        String name = body.get("name");
        String fuelType = body.get("fuelType");
        String category = body.get("category");
        VehicleModel model = brandModelService.addModel(brandId, name, fuelType, category);
        return ResponseEntity.ok(ApiResponse.ok(model));
    }
}
