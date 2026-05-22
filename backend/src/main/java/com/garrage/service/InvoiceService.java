package com.garrage.service;

import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Invoice;
import com.garrage.repository.InvoiceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class InvoiceService {

    private final InvoiceRepository invoiceRepository;
    private final ActivityLogService activityLogService;

    public Invoice createInvoice(Invoice invoice, String garageId) {
        log.info("Creating invoice for garage {}", garageId);
        invoice.setGarageId(garageId);
        invoice.setStatus("draft");

        String invoiceNumber = generateInvoiceNumber(invoice.getType(), garageId);
        invoice.setInvoiceNumber(invoiceNumber);

        Invoice saved = invoiceRepository.save(invoice);
        activityLogService.log("CREATE", "INVOICE", saved.getId(),
                "created invoice " + saved.getInvoiceNumber());
        return saved;
    }

    public List<Invoice> getInvoices(String garageId) {
        log.info("Fetching invoices for garage {}", garageId);
        return invoiceRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public Invoice getInvoiceById(String id, String garageId) {
        log.info("Fetching invoice {} for garage {}", id, garageId);
        return invoiceRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
    }

    public Invoice updateInvoiceStatus(String id, String status, String garageId) {
        log.info("Updating invoice {} status to '{}' for garage {}", id, status, garageId);
        Invoice invoice = invoiceRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Invoice not found with id: " + id));
        invoice.setStatus(status);
        Invoice saved = invoiceRepository.save(invoice);
        activityLogService.log("UPDATE", "INVOICE", saved.getId(),
                "updated invoice " + saved.getInvoiceNumber() + " status to '" + status + "'");
        return saved;
    }

    private String generateInvoiceNumber(String type, String garageId) {
        int year = Year.now().getValue();
        String prefix = "proforma".equalsIgnoreCase(type) ? "PI" : "INV";
        List<Invoice> existing = invoiceRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long count = existing.stream()
                .filter(inv -> inv.getInvoiceNumber() != null
                        && inv.getInvoiceNumber().startsWith(prefix + "-" + year))
                .count();
        return String.format("%s-%d-%04d", prefix, year, count + 1);
    }
}
