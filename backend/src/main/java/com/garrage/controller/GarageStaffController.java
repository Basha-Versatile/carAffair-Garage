package com.garrage.controller;

import com.garrage.dto.request.CreateStaffRequest;
import com.garrage.dto.request.UpdateStaffRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.StaffResponse;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.GarageStaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garage-staff")
@RequiredArgsConstructor
public class GarageStaffController {

    private final GarageStaffService garageStaffService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StaffResponse>>> listStaff() {
        String garageId = TenantContext.getGarageId();
        List<StaffResponse> staff = garageStaffService.listStaff(garageId);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        String garageId = TenantContext.getGarageId();
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        StaffResponse staff = garageStaffService.createStaff(
                request, garageId, principal.getGarageName());
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable String id,
            @Valid @RequestBody UpdateStaffRequest request) {
        String garageId = TenantContext.getGarageId();
        StaffResponse staff = garageStaffService.updateStaff(id, request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeStaff(@PathVariable String id) {
        String garageId = TenantContext.getGarageId();
        garageStaffService.removeStaff(id, garageId);
        return ResponseEntity.ok(ApiResponse.okMessage("Staff member removed"));
    }
}
