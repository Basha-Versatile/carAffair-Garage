package com.garrage.controller;

import com.garrage.dto.request.CreateOrderRequest;
import com.garrage.dto.request.UpdateOrderRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Order;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Order>>> getOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        String garageId = TenantContext.getGarageId();
        List<Order> orders;

        if (status != null && !status.isBlank()) {
            orders = orderService.getOrdersByStatus(garageId, status);
        } else {
            orders = orderService.getOrders(garageId);
        }

        // Apply date filters if provided
        if (dateFrom != null && !dateFrom.isBlank()) {
            orders = orders.stream()
                    .filter(o -> o.getDate() != null && o.getDate().compareTo(dateFrom) >= 0)
                    .toList();
        }
        if (dateTo != null && !dateTo.isBlank()) {
            orders = orders.stream()
                    .filter(o -> o.getDate() != null && o.getDate().compareTo(dateTo) <= 0)
                    .toList();
        }

        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Order>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.createOrder(request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderById(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Order>> updateOrder(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.updateOrder(id, request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOrderCounts() {
        Map<String, Long> counts = orderService.getOrderCounts(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(counts));
    }
}
