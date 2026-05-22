package com.garrage.controller;

import com.garrage.dto.request.CreateVehicleRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Vehicle;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.VehicleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Vehicle>>> getVehicles() {
        List<Vehicle> vehicles = vehicleService.getVehicles(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Vehicle>> createVehicle(@Valid @RequestBody CreateVehicleRequest request) {
        PermissionChecker.require("VEHICLES:MANAGE");
        Vehicle vehicle = vehicleService.createVehicle(request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(vehicle));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<Vehicle>>> searchByRegNumber(@RequestParam("reg") String regNumber) {
        List<Vehicle> vehicles = vehicleService.searchVehicles(regNumber, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(vehicles));
    }
}
