package com.garrage.controller;

import com.garrage.dto.request.CreatePartRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Part;
import com.garrage.security.TenantContext;
import com.garrage.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class PartController {

    private final PartService partService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Part>>> getParts() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/parts for garage {}", garageId);
        List<Part> parts = partService.getParts(garageId);
        return ResponseEntity.ok(ApiResponse.ok(parts));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Part>> createPart(@Valid @RequestBody CreatePartRequest request) {
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/parts for garage {}", garageId);
        Part part = partService.createPart(request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(part));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Part>> updatePart(
            @PathVariable String id,
            @RequestBody Part request) {
        String garageId = TenantContext.getGarageId();
        log.info("PUT /api/parts/{} for garage {}", id, garageId);
        Part part = partService.updatePartFromModel(id, request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(part));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Part>>> getLowStockParts() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/parts/low-stock for garage {}", garageId);
        List<Part> parts = partService.getLowStockParts(garageId);
        return ResponseEntity.ok(ApiResponse.ok(parts));
    }
}
