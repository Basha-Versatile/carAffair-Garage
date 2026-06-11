package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ServiceCategory;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ServiceCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/service-categories")
@RequiredArgsConstructor
public class ServiceCategoryController {

    private final ServiceCategoryService serviceCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceCategory>>> getCategories() {
        PermissionChecker.require("SETTINGS:VIEW");
        List<ServiceCategory> categories = serviceCategoryService.getCategories(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceCategory>> createCategory(@RequestBody Map<String, String> body) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String name = body.get("name");
        ServiceCategory category = serviceCategoryService.createCategory(name, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(category));
    }
}
