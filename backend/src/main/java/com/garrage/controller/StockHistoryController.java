package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.StockHistory;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.repository.StockHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/stock-history")
@RequiredArgsConstructor
public class StockHistoryController {

    private final StockHistoryRepository stockHistoryRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<StockHistory>>> getAllHistory() {
        PermissionChecker.require("INVENTORY:VIEW");
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/stock-history for garage {}", garageId);
        List<StockHistory> history = stockHistoryRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }

    @GetMapping("/part/{partId}")
    public ResponseEntity<ApiResponse<List<StockHistory>>> getHistoryByPart(@PathVariable String partId) {
        PermissionChecker.require("INVENTORY:VIEW");
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/stock-history/part/{} for garage {}", partId, garageId);
        List<StockHistory> history = stockHistoryRepository
                .findByGarageIdAndPartIdOrderByCreatedAtDesc(garageId, partId);
        return ResponseEntity.ok(ApiResponse.ok(history));
    }
}
