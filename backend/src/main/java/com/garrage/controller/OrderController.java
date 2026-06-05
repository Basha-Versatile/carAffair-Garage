package com.garrage.controller;

import com.garrage.dto.request.*;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Order;
import com.garrage.model.VehicleAnalytics;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.GstCalculationService;
import com.garrage.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    // ─── Authenticated endpoints (/api/orders/**) ───

    @GetMapping("/api/orders")
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

    @PostMapping("/api/orders")
    public ResponseEntity<ApiResponse<Order>> createOrder(@Valid @RequestBody CreateOrderRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.createOrder(request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/api/orders/{id}")
    public ResponseEntity<ApiResponse<Order>> getOrderById(@PathVariable String id) {
        Order order = orderService.getOrderById(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PutMapping("/api/orders/{id}")
    public ResponseEntity<ApiResponse<Order>> updateOrder(
            @PathVariable String id,
            @Valid @RequestBody UpdateOrderRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.updateOrder(id, request, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/api/orders/counts")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOrderCounts() {
        Map<String, Long> counts = orderService.getOrderCounts(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(counts));
    }

    // ─── Inspection ───

    @PutMapping("/api/orders/{id}/inspection")
    public ResponseEntity<ApiResponse<Order>> completeInspection(
            @PathVariable String id,
            @Valid @RequestBody InspectionRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.completeInspection(id, TenantContext.getGarageId(),
                request.getCustomerRemarks(), request.getInspectionNotes());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    // ─── Estimate ───

    @PutMapping("/api/orders/{id}/estimate")
    public ResponseEntity<ApiResponse<Order>> saveEstimate(
            @PathVariable String id,
            @Valid @RequestBody SaveEstimateRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.saveEstimate(id, TenantContext.getGarageId(),
                request.getLineItems(), request.getEstimateType(), request.getPlaceOfSupply(),
                request.getEstimatedDeliveryDate(),
                request.getSubtotal(), request.getDiscountAmount(),
                request.getCgstAmount(), request.getSgstAmount(),
                request.getIgstAmount(), request.getTotalGst(), request.getGrandTotal());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/api/orders/{id}/send-estimate")
    public ResponseEntity<ApiResponse<Order>> sendEstimate(@PathVariable String id) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.sendEstimate(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/api/orders/{id}/resend-estimate")
    public ResponseEntity<ApiResponse<Order>> resendEstimate(@PathVariable String id) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.resendEstimate(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/api/orders/{id}/estimate-link")
    public ResponseEntity<ApiResponse<String>> getEstimateLink(@PathVariable String id) {
        String token = orderService.getEstimateLink(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(token));
    }

    // ─── Service Assignment ───

    @PutMapping("/api/orders/{id}/assign")
    public ResponseEntity<ApiResponse<Order>> assignService(
            @PathVariable String id,
            @Valid @RequestBody AssignServiceRequest request) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.assignService(id, TenantContext.getGarageId(),
                request.getLineItemId(), request.getStaffUserId(), request.getStaffUserName());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PutMapping("/api/orders/{id}/assignment-status")
    public ResponseEntity<ApiResponse<Order>> updateAssignmentStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateAssignmentRequest request) {
        Order order = orderService.updateAssignmentStatus(id, TenantContext.getGarageId(),
                request.getLineItemId(), request.getStatus(), request.getNotes());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    // ─── Payment ───

    @PostMapping("/api/orders/{id}/mark-payment-due")
    public ResponseEntity<ApiResponse<Order>> markPaymentDue(@PathVariable String id) {
        PermissionChecker.require("ORDERS:MANAGE");
        Order order = orderService.markPaymentDue(id, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/api/public/payment/{token}")
    public ResponseEntity<ApiResponse<Order>> getPublicPayment(@PathVariable String token) {
        Order order = orderService.getOrderByPaymentToken(token);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/api/public/payment/{token}/confirm")
    public ResponseEntity<ApiResponse<Order>> confirmPayment(@PathVariable String token) {
        Order order = orderService.confirmPayment(token);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    // ─── Orders by Customer ───

    @GetMapping("/api/orders/by-customer/{customerId}")
    public ResponseEntity<ApiResponse<List<Order>>> getOrdersByCustomer(@PathVariable String customerId) {
        String garageId = TenantContext.getGarageId();
        List<Order> orders = orderService.getOrdersByCustomer(customerId, garageId);
        return ResponseEntity.ok(ApiResponse.ok(orders));
    }

    // ─── Delivery Alerts ───

    @GetMapping("/api/orders/delivery-alerts")
    public ResponseEntity<ApiResponse<List<Order>>> getDeliveryAlerts() {
        List<Order> alerts = orderService.getDeliveryAlerts(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(alerts));
    }

    // ─── Vehicle Analytics ───

    @GetMapping("/api/orders/vehicle-analytics")
    public ResponseEntity<ApiResponse<List<VehicleAnalytics>>> getVehicleAnalytics() {
        List<VehicleAnalytics> analytics = orderService.getVehicleAnalytics(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(analytics));
    }

    // ─── GST States ───

    @GetMapping("/api/gst/states")
    public ResponseEntity<ApiResponse<List<String>>> getIndianStates() {
        return ResponseEntity.ok(ApiResponse.ok(GstCalculationService.getStates()));
    }

    @GetMapping("/api/gst/cities")
    public ResponseEntity<ApiResponse<List<String>>> getCitiesByState(@RequestParam String state) {
        return ResponseEntity.ok(ApiResponse.ok(GstCalculationService.getCitiesByState(state)));
    }

    // ─── Public endpoints (no auth) ───

    @GetMapping("/api/public/onboarding/{token}")
    public ResponseEntity<ApiResponse<Order>> getPublicOnboarding(@PathVariable String token) {
        Order order = orderService.getOrderByOnboardingToken(token);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @GetMapping("/api/public/estimate/{token}")
    public ResponseEntity<ApiResponse<Order>> getPublicEstimate(@PathVariable String token) {
        Order order = orderService.getOrderByEstimateToken(token);
        return ResponseEntity.ok(ApiResponse.ok(order));
    }

    @PostMapping("/api/public/estimate/{token}/respond")
    public ResponseEntity<ApiResponse<Order>> respondToEstimate(
            @PathVariable String token,
            @RequestBody EstimateResponseRequest request) {
        Order order = orderService.respondToEstimate(token, request.isApproved(),
                request.getRejectionNote(), request.isRequestedProforma());
        return ResponseEntity.ok(ApiResponse.ok(order));
    }
}
