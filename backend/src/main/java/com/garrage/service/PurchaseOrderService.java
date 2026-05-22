package com.garrage.service;

import com.garrage.model.PurchaseOrder;
import com.garrage.repository.PurchaseOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final ActivityLogService activityLogService;

    public PurchaseOrder createPurchaseOrder(PurchaseOrder po, String garageId) {
        log.info("Creating purchase order for garage {}", garageId);
        po.setGarageId(garageId);

        String poNumber = generatePoNumber(garageId);
        po.setPoNumber(poNumber);

        PurchaseOrder saved = purchaseOrderRepository.save(po);
        activityLogService.log("CREATE", "PURCHASE_ORDER", saved.getId(),
                "created purchase order " + saved.getPoNumber());
        return saved;
    }

    public List<PurchaseOrder> getPurchaseOrders(String garageId) {
        log.info("Fetching purchase orders for garage {}", garageId);
        return purchaseOrderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    private String generatePoNumber(String garageId) {
        int year = Year.now().getValue();
        List<PurchaseOrder> existing = purchaseOrderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long count = existing.stream()
                .filter(po -> po.getPoNumber() != null && po.getPoNumber().startsWith("PO-" + year))
                .count();
        return String.format("PO-%d-%04d", year, count + 1);
    }
}
