package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.PurchaseOrder;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.PurchaseOrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/purchase-orders")
@RequiredArgsConstructor
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<PurchaseOrder>>> getPurchaseOrders() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/purchase-orders for garage {}", garageId);
        List<PurchaseOrder> orders = purchaseOrderService.getPurchaseOrders(garageId);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<PurchaseOrder>> createPurchaseOrder(
            @RequestBody PurchaseOrder purchaseOrder) {
        PermissionChecker.require("INVENTORY:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/purchase-orders for garage {}", garageId);
        PurchaseOrder created = purchaseOrderService.createPurchaseOrder(purchaseOrder, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
