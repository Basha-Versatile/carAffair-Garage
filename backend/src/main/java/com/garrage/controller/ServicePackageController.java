package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Order;
import com.garrage.model.ServicePackage;
import com.garrage.repository.ServicePackageRepository;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
public class ServicePackageController {

    private final ServicePackageRepository packageRepository;
    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServicePackage>>> getPackages() {
        PermissionChecker.require("SETTINGS:VIEW");
        String garageId = TenantContext.getGarageId();
        List<ServicePackage> packages = packageRepository.findByGarageIdAndIsActiveTrue(garageId);
        return ResponseEntity.ok(ApiResponse.ok(packages));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServicePackage>> createPackage(
            @Valid @RequestBody ServicePackage request) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        request.setGarageId(garageId);
        request.setActive(true);
        ServicePackage saved = packageRepository.save(request);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServicePackage>> updatePackage(
            @PathVariable String id,
            @Valid @RequestBody ServicePackage request) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        ServicePackage existing = packageRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found"));

        existing.setName(request.getName());
        existing.setDescription(request.getDescription());
        existing.setServiceItems(request.getServiceItems());
        existing.setPartItems(request.getPartItems());
        existing.setTotalEstimate(request.getTotalEstimate());

        ServicePackage saved = packageRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok(saved));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deletePackage(@PathVariable String id) {
        PermissionChecker.require("SETTINGS:MANAGE");
        String garageId = TenantContext.getGarageId();
        ServicePackage existing = packageRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found"));

        existing.setActive(false);
        packageRepository.save(existing);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * Apply a package to an order — adds package items as line items (prices editable after).
     */
    @PostMapping("/apply/{packageId}/order/{orderId}")
    public ResponseEntity<ApiResponse<Order>> applyPackageToOrder(
            @PathVariable String packageId,
            @PathVariable String orderId) {
        PermissionChecker.require("ORDERS:MANAGE");
        String garageId = TenantContext.getGarageId();

        ServicePackage pkg = packageRepository.findByIdAndGarageId(packageId, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Package not found"));

        Order order = orderService.getOrderById(orderId, garageId);

        List<Order.OrderLineItem> lineItems = order.getLineItems();
        if (lineItems == null) {
            lineItems = new ArrayList<>();
        }

        // Add service items from package
        if (pkg.getServiceItems() != null) {
            for (ServicePackage.PackageServiceItem si : pkg.getServiceItems()) {
                lineItems.add(Order.OrderLineItem.builder()
                        .id(UUID.randomUUID().toString())
                        .itemType("service")
                        .serviceId(si.getServiceId())
                        .packageId(pkg.getId())
                        .description(si.getServiceName())
                        .hsnSac(si.getHsnSac())
                        .qty(si.getDefaultQty())
                        .rate(si.getDefaultRate())
                        .discountPercent(0)
                        .amount(si.getDefaultQty() * si.getDefaultRate())
                        .gstRate(si.getGstRate())
                        .gstAmount(0)
                        .build());
            }
        }

        // Add part items from package
        if (pkg.getPartItems() != null) {
            for (ServicePackage.PackagePartItem pi : pkg.getPartItems()) {
                lineItems.add(Order.OrderLineItem.builder()
                        .id(UUID.randomUUID().toString())
                        .itemType("part")
                        .partId(pi.getPartId())
                        .packageId(pkg.getId())
                        .description(pi.getPartName())
                        .hsnSac(pi.getHsnSac())
                        .qty(pi.getDefaultQty())
                        .rate(pi.getDefaultRate())
                        .discountPercent(0)
                        .amount(pi.getDefaultQty() * pi.getDefaultRate())
                        .gstRate(pi.getGstRate())
                        .gstAmount(0)
                        .build());
            }
        }

        order.setLineItems(lineItems);
        // Save directly — GST recalculation happens when estimate is saved
        Order saved = orderService.saveEstimate(orderId, garageId, lineItems,
                order.getEstimateType(), order.getPlaceOfSupply(),
                order.getEstimatedDeliveryDate(),
                order.getSubtotal(), order.getDiscountAmount(),
                order.getCgstAmount(), order.getSgstAmount(),
                order.getIgstAmount(), order.getTotalGst(), order.getGrandTotal());

        return ResponseEntity.ok(ApiResponse.ok(saved));
    }
}
