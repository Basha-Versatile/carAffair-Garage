package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.PartPurchase;
import com.garrage.security.TenantContext;
import com.garrage.service.PartPurchaseService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/part-purchases")
@RequiredArgsConstructor
public class PartPurchaseController {

    private final PartPurchaseService partPurchaseService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PartPurchase>>> getPartPurchases() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/part-purchases for garage {}", garageId);
        List<PartPurchase> purchases = partPurchaseService.getPartPurchases(garageId);
        return ResponseEntity.ok(ApiResponse.ok(purchases));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PartPurchase>> createPartPurchase(@RequestBody PartPurchase partPurchase) {
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/part-purchases for garage {}", garageId);
        PartPurchase created = partPurchaseService.createPartPurchase(partPurchase, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
