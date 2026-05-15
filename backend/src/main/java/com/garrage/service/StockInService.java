package com.garrage.service;

import com.garrage.model.Part;
import com.garrage.model.StockInRecord;
import com.garrage.repository.PartRepository;
import com.garrage.repository.StockInRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class StockInService {

    private final StockInRepository stockInRepository;
    private final PartRepository partRepository;

    public StockInRecord createStockIn(StockInRecord record, String garageId) {
        log.info("Creating stock-in record for garage {}", garageId);
        record.setGarageId(garageId);
        StockInRecord saved = stockInRepository.save(record);

        // Update stock quantities for each part
        if (record.getItems() != null) {
            for (StockInRecord.StockInItem item : record.getItems()) {
                if (item.getPartId() != null && item.getQty() > 0) {
                    Optional<Part> partOpt = partRepository.findByIdAndGarageId(item.getPartId(), garageId);
                    partOpt.ifPresent(part -> {
                        part.setStockQty(part.getStockQty() + item.getQty());
                        partRepository.save(part);
                        log.info("Updated stock for part {}: +{} = {}", part.getName(), item.getQty(), part.getStockQty());
                    });
                }
            }
        }

        return saved;
    }

    public List<StockInRecord> getStockInRecords(String garageId) {
        log.info("Fetching stock-in records for garage {}", garageId);
        return stockInRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }
}
