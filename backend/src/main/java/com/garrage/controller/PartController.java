package com.garrage.controller;

import com.garrage.dto.request.CreatePartRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Part;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.PartService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/parts")
@RequiredArgsConstructor
public class PartController {

    private final PartService partService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Part>>> getParts() {
        PermissionChecker.require("INVENTORY:VIEW");
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/parts for garage {}", garageId);
        List<Part> parts = partService.getParts(garageId);
        return ResponseEntity.ok(ApiResponse.ok(parts));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Part>> getPartById(@PathVariable String id) {
        PermissionChecker.require("INVENTORY:VIEW");
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/parts/{} for garage {}", id, garageId);
        Part part = partService.getPartById(id, garageId);
        return ResponseEntity.ok(ApiResponse.ok(part));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Part>> createPart(@Valid @RequestBody CreatePartRequest request) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/parts for garage {}", garageId);
        Part part = partService.createPart(request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(part));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Part>> updatePart(
            @PathVariable String id,
            @RequestBody Part request) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("PUT /api/parts/{} for garage {}", id, garageId);
        Part part = partService.updatePartFromModel(id, request, garageId);
        return ResponseEntity.ok(ApiResponse.ok(part));
    }

    @GetMapping("/low-stock")
    public ResponseEntity<ApiResponse<List<Part>>> getLowStockParts() {
        PermissionChecker.require("INVENTORY:VIEW");
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/parts/low-stock for garage {}", garageId);
        List<Part> parts = partService.getLowStockParts(garageId);
        return ResponseEntity.ok(ApiResponse.ok(parts));
    }

    @PostMapping(value = "/upload-csv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<List<Part>>> uploadCsv(@RequestParam("file") MultipartFile file) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/parts/upload-csv for garage {}", garageId);

        List<Part> created = new ArrayList<>();
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {

            String headerLine = reader.readLine();
            if (headerLine == null) {
                return ResponseEntity.badRequest()
                        .body(ApiResponse.error("CSV file is empty"));
            }

            String line;
            int row = 1;
            while ((line = reader.readLine()) != null) {
                row++;
                String[] cols = line.split(",", -1);
                if (cols.length < 2) continue;

                try {
                    CreatePartRequest req = new CreatePartRequest();
                    req.setName(cols[0].trim());
                    req.setPartNumber(cols.length > 1 ? cols[1].trim() : "");
                    req.setBrand(cols.length > 2 ? cols[2].trim() : "");
                    req.setCategory(cols.length > 3 ? cols[3].trim() : "");
                    req.setMrp(cols.length > 4 ? parseDouble(cols[4]) : 0);
                    req.setPurchasePrice(cols.length > 5 ? parseDouble(cols[5]) : 0);
                    req.setSellingPrice(cols.length > 6 ? parseDouble(cols[6]) : 0);
                    req.setStockQty(cols.length > 7 ? parseInt(cols[7]) : 0);
                    req.setMinStockQty(cols.length > 8 ? parseInt(cols[8]) : 0);
                    req.setMaxStockQty(cols.length > 9 ? parseInt(cols[9]) : 0);
                    req.setRackNumber(cols.length > 10 ? cols[10].trim() : "");
                    req.setHsnCode(cols.length > 11 ? cols[11].trim() : "");
                    req.setGstRate(cols.length > 12 ? parseDouble(cols[12]) : 0);
                    req.setUnit(cols.length > 13 ? cols[13].trim() : "pcs");

                    Part part = partService.createPart(req, garageId);
                    created.add(part);
                } catch (Exception e) {
                    log.warn("Skipping CSV row {}: {}", row, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("CSV upload failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Failed to process CSV: " + e.getMessage()));
        }

        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    private double parseDouble(String val) {
        try {
            return Double.parseDouble(val.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private int parseInt(String val) {
        try {
            return Integer.parseInt(val.trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
