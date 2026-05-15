package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.CounterSale;
import com.garrage.security.TenantContext;
import com.garrage.service.CounterSaleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/counter-sales")
@RequiredArgsConstructor
public class CounterSaleController {

    private final CounterSaleService counterSaleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CounterSale>>> getCounterSales() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/counter-sales for garage {}", garageId);
        List<CounterSale> sales = counterSaleService.getCounterSales(garageId);
        return ResponseEntity.ok(ApiResponse.ok(sales));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CounterSale>> createCounterSale(
            @RequestBody CounterSale sale) {
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/counter-sales for garage {}", garageId);
        CounterSale created = counterSaleService.createCounterSale(sale, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
