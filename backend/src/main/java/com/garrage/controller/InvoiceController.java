package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Invoice;
import com.garrage.security.TenantContext;
import com.garrage.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
public class InvoiceController {

    private final InvoiceService invoiceService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoices() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/invoices for garage {}", garageId);
        List<Invoice> invoices = invoiceService.getInvoices(garageId);
        return ResponseEntity.ok(ApiResponse.ok(invoices));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Invoice>> createInvoice(@RequestBody Invoice invoice) {
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/invoices for garage {}", garageId);
        Invoice created = invoiceService.createInvoice(invoice, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Invoice>> getInvoiceById(@PathVariable String id) {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/invoices/{} for garage {}", id, garageId);
        Invoice invoice = invoiceService.getInvoiceById(id, garageId);
        return ResponseEntity.ok(ApiResponse.ok(invoice));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<ApiResponse<Invoice>> updateInvoiceStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String garageId = TenantContext.getGarageId();
        String status = body.get("status");
        log.info("PUT /api/invoices/{}/status to '{}' for garage {}", id, status, garageId);
        Invoice updated = invoiceService.updateInvoiceStatus(id, status, garageId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
