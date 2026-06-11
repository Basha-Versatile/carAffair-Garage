package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Tag;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.TagService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Tag>>> getTags(
            @RequestParam(required = false) String type) {
        PermissionChecker.require("SETTINGS:VIEW");
        String garageId = TenantContext.getGarageId();
        List<Tag> tags;
        if (type != null && !type.isBlank()) {
            tags = tagService.getTagsByType(garageId, type);
        } else {
            tags = tagService.getTags(garageId);
        }
        return ResponseEntity.ok(ApiResponse.ok(tags));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Tag>> createTag(@RequestBody Tag tag) {
        PermissionChecker.require("SETTINGS:MANAGE");
        Tag created = tagService.createTag(tag, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Tag>> updateTag(
            @PathVariable String id, @RequestBody Tag tag) {
        PermissionChecker.require("SETTINGS:MANAGE");
        Tag updated = tagService.updateTag(id, tag, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteTag(@PathVariable String id) {
        PermissionChecker.require("SETTINGS:MANAGE");
        tagService.deleteTag(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }
}
