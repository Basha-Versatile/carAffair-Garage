package com.garrage.controller;

import com.garrage.dto.request.CreateRoleRequest;
import com.garrage.dto.request.UpdateRoleRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.GarageRole;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.GarageRoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garage-roles")
@RequiredArgsConstructor
public class GarageRoleController {

    private final GarageRoleService garageRoleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<GarageRole>>> listRoles() {
        if (!PermissionChecker.has("SETTINGS:VIEW") && !PermissionChecker.has("STAFF:VIEW")) {
            PermissionChecker.require("SETTINGS:VIEW");
        }
        String garageId = TenantContext.getGarageId();
        List<GarageRole> roles = garageRoleService.listRoles(garageId);
        return ResponseEntity.ok(ApiResponse.ok(roles));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageRole>> getRole(@PathVariable String id) {
        if (!PermissionChecker.has("SETTINGS:VIEW") && !PermissionChecker.has("STAFF:VIEW")) {
            PermissionChecker.require("SETTINGS:VIEW");
        }
        String garageId = TenantContext.getGarageId();
        GarageRole role = garageRoleService.getRoleById(id, garageId);
        return ResponseEntity.ok(ApiResponse.ok(role));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<GarageRole>> createRole(
            @Valid @RequestBody CreateRoleRequest request) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        GarageRole role = garageRoleService.createRole(request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(role));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GarageRole>> updateRole(
            @PathVariable String id,
            @Valid @RequestBody UpdateRoleRequest request) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        GarageRole role = garageRoleService.updateRole(id, request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(role));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteRole(@PathVariable String id) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        garageRoleService.deleteRole(id, garageId);
        return ResponseEntity.ok(ApiResponse.okMessage("Role deleted successfully"));
    }
}
