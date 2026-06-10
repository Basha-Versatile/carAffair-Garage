package com.garrage.controller;

import com.garrage.dto.request.CreateStaffRequest;
import com.garrage.dto.request.UpdateStaffRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.StaffResponse;
import com.garrage.model.GarageRole;
import com.garrage.security.PermissionChecker;
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
        PermissionChecker.require("STAFF:VIEW");
        String garageId = TenantContext.getGarageId();
        List<StaffResponse> staff = garageStaffService.listStaff(garageId);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StaffResponse>> createStaff(
            @Valid @RequestBody CreateStaffRequest request) {
        PermissionChecker.require("STAFF:MANAGE");
        String garageId = TenantContext.getGarageId();
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        StaffResponse staff = garageStaffService.createStaff(
                request, garageId, principal.getGarageName(), principal);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<StaffResponse>> updateStaff(
            @PathVariable String id,
            @Valid @RequestBody UpdateStaffRequest request) {
        PermissionChecker.require("STAFF:MANAGE");
        String garageId = TenantContext.getGarageId();
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        StaffResponse staff = garageStaffService.updateStaff(id, request, garageId, principal);
        return ResponseEntity.ok(ApiResponse.ok(staff));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeStaff(@PathVariable String id) {
        PermissionChecker.require("STAFF:MANAGE");
        String garageId = TenantContext.getGarageId();
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        garageStaffService.removeStaff(id, garageId, principal);
        return ResponseEntity.ok(ApiResponse.okMessage("Staff member removed"));
    }

    /**
     * Returns the roles that the current user is allowed to assign to staff.
     * Owner sees all roles; staff see only roles below their hierarchy level.
     */
    @GetMapping("/assignable-roles")
    public ResponseEntity<ApiResponse<List<GarageRole>>> getAssignableRoles() {
        PermissionChecker.require("STAFF:VIEW");
        String garageId = TenantContext.getGarageId();
        UserPrincipal principal = (UserPrincipal) SecurityContextHolder
                .getContext().getAuthentication().getPrincipal();
        List<GarageRole> roles = garageStaffService.getAssignableRoles(garageId, principal);
        return ResponseEntity.ok(ApiResponse.ok(roles));
    }
}
