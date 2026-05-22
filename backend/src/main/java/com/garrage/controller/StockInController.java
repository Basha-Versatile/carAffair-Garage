package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.StockInRecord;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.StockInService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stock-in")
@RequiredArgsConstructor
public class StockInController {

    private final StockInService stockInService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockInRecord>>> getStockInRecords() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/stock-in for garage {}", garageId);
        List<StockInRecord> records = stockInService.getStockInRecords(garageId);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<StockInRecord>> createStockIn(
            @RequestBody StockInRecord record) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/stock-in for garage {}", garageId);
        StockInRecord created = stockInService.createStockIn(record, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
