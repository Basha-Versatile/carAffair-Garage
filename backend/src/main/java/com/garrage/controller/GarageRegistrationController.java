package com.garrage.controller;

import com.garrage.dto.request.GarageRegistrationRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.GarageRegistration;
import com.garrage.service.GarageRegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/garage-registrations")
@RequiredArgsConstructor
public class GarageRegistrationController {

    private final GarageRegistrationService registrationService;

    @PostMapping
    public ResponseEntity<ApiResponse<GarageRegistration>> submitRegistration(
            @Valid @RequestBody GarageRegistrationRequest request) {
        GarageRegistration registration = registrationService.submitRegistration(request);
        return ResponseEntity.ok(ApiResponse.ok(registration));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<GarageRegistration>>> getAllRegistrations() {
        List<GarageRegistration> registrations = registrationService.getAllRegistrations();
        return ResponseEntity.ok(ApiResponse.ok(registrations));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageRegistration>> getRegistrationById(@PathVariable String id) {
        GarageRegistration registration = registrationService.getRegistrationById(id);
        return ResponseEntity.ok(ApiResponse.ok(registration));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approveRegistration(@PathVariable String id) {
        registrationService.approveRegistration(id);
        return ResponseEntity.ok(ApiResponse.ok("Registration approved successfully."));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> rejectRegistration(
            @PathVariable String id, @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        registrationService.rejectRegistration(id, reason);
        return ResponseEntity.ok(ApiResponse.ok("Registration rejected."));
    }
}
