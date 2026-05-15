package com.garrage.service;

import com.garrage.model.CounterSale;
import com.garrage.model.Part;
import com.garrage.repository.CounterSaleRepository;
import com.garrage.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class CounterSaleService {

    private final CounterSaleRepository counterSaleRepository;
    private final PartRepository partRepository;

    public CounterSale createCounterSale(CounterSale sale, String garageId) {
        log.info("Creating counter sale for garage {}", garageId);
        sale.setGarageId(garageId);

        String invoiceNumber = generateInvoiceNumber(garageId);
        sale.setInvoiceNumber(invoiceNumber);

        CounterSale saved = counterSaleRepository.save(sale);

        // Decrement stock for each part sold
        if (sale.getItems() != null) {
            for (CounterSale.CSItem item : sale.getItems()) {
                if (item.getPartId() != null && item.getQty() > 0) {
                    Optional<Part> partOpt = partRepository.findByIdAndGarageId(item.getPartId(), garageId);
                    partOpt.ifPresent(part -> {
                        part.setStockQty(Math.max(0, part.getStockQty() - item.getQty()));
                        partRepository.save(part);
                        log.info("Decremented stock for part {}: -{} = {}", part.getName(), item.getQty(), part.getStockQty());
                    });
                }
            }
        }

        return saved;
    }

    public List<CounterSale> getCounterSales(String garageId) {
        log.info("Fetching counter sales for garage {}", garageId);
        return counterSaleRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    private String generateInvoiceNumber(String garageId) {
        int year = Year.now().getValue();
        List<CounterSale> existing = counterSaleRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long count = existing.stream()
                .filter(s -> s.getInvoiceNumber() != null && s.getInvoiceNumber().startsWith("CS-" + year))
                .count();
        return String.format("CS-%d-%03d", year, count + 1);
    }
}
