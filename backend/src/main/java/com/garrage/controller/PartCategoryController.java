package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.PartCategory;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.PartCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/part-categories")
@RequiredArgsConstructor
public class PartCategoryController {

    private final PartCategoryService partCategoryService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PartCategory>>> getCategories() {
        PermissionChecker.require("INVENTORY:VIEW");
        List<PartCategory> categories = partCategoryService.getCategories(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartCategory>> createCategory(@RequestBody Map<String, String> body) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String name = body.get("name");
        PartCategory category = partCategoryService.createCategory(name, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(category));
    }
}
