package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Manufacturer;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ManufacturerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/manufacturers")
@RequiredArgsConstructor
public class ManufacturerController {

    private final ManufacturerService manufacturerService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Manufacturer>>> getManufacturers() {
        List<Manufacturer> manufacturers = manufacturerService.getManufacturers(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(manufacturers));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Manufacturer>> createManufacturer(@RequestBody Map<String, String> body) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String name = body.get("name");
        Manufacturer manufacturer = manufacturerService.createManufacturer(name, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(manufacturer));
    }
}
