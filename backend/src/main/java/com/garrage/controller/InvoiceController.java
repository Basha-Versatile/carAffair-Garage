package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Garage;
import com.garrage.model.Invoice;
import com.garrage.repository.CustomerRepository;
import com.garrage.repository.GarageRepository;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.EmailService;
import com.garrage.service.InvoicePdfService;
import com.garrage.service.InvoiceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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
    private final InvoicePdfService invoicePdfService;
    private final EmailService emailService;
    private final GarageRepository garageRepository;
    private final CustomerRepository customerRepository;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Invoice>>> getInvoices() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/invoices for garage {}", garageId);
        List<Invoice> invoices = invoiceService.getInvoices(garageId);
        return ResponseEntity.ok(ApiResponse.ok(invoices));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Invoice>> createInvoice(@RequestBody Invoice invoice) {
        PermissionChecker.require("INVOICES:MANAGE");
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
        PermissionChecker.require("INVOICES:MANAGE");
        String garageId = TenantContext.getGarageId();
        String status = body.get("status");
        log.info("PUT /api/invoices/{}/status to '{}' for garage {}", id, status, garageId);
        Invoice updated = invoiceService.updateInvoiceStatus(id, status, garageId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/{id}/pdf")
    public ResponseEntity<byte[]> downloadInvoicePdf(@PathVariable String id) {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/invoices/{}/pdf for garage {}", id, garageId);
        Invoice invoice = invoiceService.getInvoiceById(id, garageId);
        Garage garage = garageRepository.findById(garageId).orElse(null);
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice, garage);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + invoice.getInvoiceNumber() + ".pdf")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfBytes);
    }

    @PostMapping("/{id}/notify")
    public ResponseEntity<ApiResponse<String>> notifyCustomer(@PathVariable String id) {
        PermissionChecker.require("INVOICES:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/invoices/{}/notify for garage {}", id, garageId);
        Invoice invoice = invoiceService.getInvoiceById(id, garageId);

        if (invoice.getCustomerPhone() == null && invoice.getCustomerName() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.okMessage("No customer info on invoice"));
        }

        Garage garage = garageRepository.findById(garageId).orElse(null);
        String garageName = garage != null ? garage.getName() : "Car Affair";

        // Find customer email — check if there's a customerId we can look up
        // For now, we need an email on the request or the customer record
        byte[] pdfBytes = invoicePdfService.generateInvoicePdf(invoice, garage);

        // We need customer email. Let's look it up from customerId if present
        String customerEmail = null;
        if (invoice.getCustomerId() != null) {
            var customerOpt = customerRepository.findByIdAndGarageId(invoice.getCustomerId(), garageId);
            if (customerOpt.isPresent()) {
                customerEmail = customerOpt.get().getEmail();
            }
        }

        if (customerEmail == null || customerEmail.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.okMessage("Customer does not have an email address"));
        }

        emailService.sendInvoiceEmail(customerEmail, invoice.getCustomerName(),
                invoice.getInvoiceNumber(), garageName, pdfBytes);

        // Update status to sent
        invoiceService.updateInvoiceStatus(id, "sent", garageId);

        return ResponseEntity.ok(ApiResponse.okMessage("Invoice notification sent to " + customerEmail));
    }
}
