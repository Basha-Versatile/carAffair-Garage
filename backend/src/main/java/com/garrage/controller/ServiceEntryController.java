package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ServiceEntry;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ServiceEntryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/garage-services")
@RequiredArgsConstructor
public class ServiceEntryController {

    private final ServiceEntryService serviceEntryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceEntry>>> getServices() {
        List<ServiceEntry> services = serviceEntryService.getServices(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(services));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceEntry>> createService(@RequestBody ServiceEntry serviceEntry) {
        PermissionChecker.require("SETTINGS:MANAGE");
        ServiceEntry created = serviceEntryService.createService(serviceEntry, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceEntry>> updateService(
            @PathVariable String id, @RequestBody ServiceEntry serviceEntry) {
        PermissionChecker.require("SETTINGS:MANAGE");
        ServiceEntry updated = serviceEntryService.updateService(id, serviceEntry, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
