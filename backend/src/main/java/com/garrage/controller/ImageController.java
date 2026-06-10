package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Order;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ImageStorageService;
import com.garrage.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.InputStreamResource;
import org.springframework.data.mongodb.gridfs.GridFsResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class ImageController {

    private final ImageStorageService imageStorageService;
    private final OrderService orderService;

    /**
     * Upload images to an order (authenticated).
     */
    @PostMapping("/api/orders/{orderId}/images")
    public ResponseEntity<ApiResponse<List<String>>> uploadImages(
            @PathVariable String orderId,
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        PermissionChecker.require("ORDERS:MANAGE");
        String garageId = TenantContext.getGarageId();

        // Verify order belongs to this garage
        Order order = orderService.getOrderById(orderId, garageId);

        List<String> fileIds = imageStorageService.storeImages(files, garageId, orderId);

        // Append new image IDs to order
        orderService.addImageIds(orderId, garageId, fileIds);

        return ResponseEntity.ok(ApiResponse.ok(fileIds));
    }

    /**
     * Get an image by GridFS file ID (authenticated).
     */
    @GetMapping("/api/images/{fileId}")
    public ResponseEntity<InputStreamResource> getImage(@PathVariable String fileId) throws IOException {
        GridFsResource resource = imageStorageService.getImage(fileId);
        if (resource == null || !resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(new InputStreamResource(resource.getInputStream()));
    }

    /**
     * Delete an image from an order (authenticated).
     */
    @DeleteMapping("/api/orders/{orderId}/images/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteImage(
            @PathVariable String orderId,
            @PathVariable String fileId) {
        PermissionChecker.require("ORDERS:MANAGE");
        String garageId = TenantContext.getGarageId();

        // Verify order belongs to this garage
        orderService.getOrderById(orderId, garageId);

        imageStorageService.deleteImage(fileId);
        orderService.removeImageId(orderId, garageId, fileId);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    // ─── Task Photos (Before/After) ───

    @PostMapping("/api/orders/{orderId}/task-images/before")
    public ResponseEntity<ApiResponse<List<String>>> uploadTaskBeforeImages(
            @PathVariable String orderId,
            @RequestParam("lineItemId") String lineItemId,
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        String garageId = TenantContext.getGarageId();
        List<String> fileIds = imageStorageService.storeImages(files, garageId, orderId);
        Order order = orderService.addTaskBeforeImages(orderId, garageId, lineItemId, fileIds);
        return ResponseEntity.ok(ApiResponse.ok(fileIds));
    }

    @PostMapping("/api/orders/{orderId}/task-images/after")
    public ResponseEntity<ApiResponse<List<String>>> uploadTaskAfterImages(
            @PathVariable String orderId,
            @RequestParam("lineItemId") String lineItemId,
            @RequestParam("files") List<MultipartFile> files) throws IOException {
        String garageId = TenantContext.getGarageId();
        List<String> fileIds = imageStorageService.storeImages(files, garageId, orderId);
        Order order = orderService.addTaskAfterImages(orderId, garageId, lineItemId, fileIds);
        return ResponseEntity.ok(ApiResponse.ok(fileIds));
    }

    @GetMapping("/api/orders/{orderId}/task-images/{lineItemId}")
    public ResponseEntity<ApiResponse<java.util.Map<String, List<String>>>> getTaskImages(
            @PathVariable String orderId,
            @PathVariable String lineItemId) {
        String garageId = TenantContext.getGarageId();
        var images = orderService.getTaskImages(orderId, garageId, lineItemId);
        return ResponseEntity.ok(ApiResponse.ok(images));
    }

    @DeleteMapping("/api/orders/{orderId}/task-images/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteTaskImage(
            @PathVariable String orderId,
            @PathVariable String fileId) {
        String garageId = TenantContext.getGarageId();
        imageStorageService.deleteImage(fileId);
        orderService.deleteTaskImage(orderId, garageId, fileId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Public image access for onboarding page (token-verified).
     */
    @GetMapping("/api/public/onboarding/{token}/images/{fileId}")
    public ResponseEntity<InputStreamResource> getPublicOnboardingImage(
            @PathVariable String token,
            @PathVariable String fileId) throws IOException {
        orderService.getOrderByOnboardingToken(token);

        GridFsResource resource = imageStorageService.getImage(fileId);
        if (resource == null || !resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(new InputStreamResource(resource.getInputStream()));
    }

    /**
     * Public image access for estimate page (token-verified).
     */
    @GetMapping("/api/public/estimate/{token}/images/{fileId}")
    public ResponseEntity<InputStreamResource> getPublicEstimateImage(
            @PathVariable String token,
            @PathVariable String fileId) throws IOException {
        // Verify the token is valid (this will throw if not found)
        orderService.getOrderByEstimateToken(token);

        GridFsResource resource = imageStorageService.getImage(fileId);
        if (resource == null || !resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(new InputStreamResource(resource.getInputStream()));
    }

    /**
     * Public image access for order status page (token-verified).
     */
    @GetMapping("/api/public/order-status/{token}/images/{fileId}")
    public ResponseEntity<InputStreamResource> getPublicOrderStatusImage(
            @PathVariable String token,
            @PathVariable String fileId) throws IOException {
        orderService.getOrderByStatusToken(token);

        GridFsResource resource = imageStorageService.getImage(fileId);
        if (resource == null || !resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(resource.getContentType()))
                .header(HttpHeaders.CACHE_CONTROL, "max-age=86400")
                .body(new InputStreamResource(resource.getInputStream()));
    }
}
