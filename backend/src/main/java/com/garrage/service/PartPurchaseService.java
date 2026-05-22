package com.garrage.service;

import com.garrage.model.PartPurchase;
import com.garrage.repository.PartPurchaseRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Year;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartPurchaseService {

    private final PartPurchaseRepository partPurchaseRepository;
    private final ActivityLogService activityLogService;

    public List<PartPurchase> getPartPurchases(String garageId) {
        return partPurchaseRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public PartPurchase createPartPurchase(PartPurchase partPurchase, String garageId) {
        partPurchase.setGarageId(garageId);
        partPurchase.setVoucherNo(generateVoucherNo(garageId));
        log.info("Creating part purchase {} for garage {}", partPurchase.getVoucherNo(), garageId);
        PartPurchase saved = partPurchaseRepository.save(partPurchase);
        activityLogService.log("CREATE", "PART_PURCHASE", saved.getId(),
                "created part purchase " + saved.getVoucherNo());
        return saved;
    }

    private String generateVoucherNo(String garageId) {
        int year = Year.now().getValue();
        List<PartPurchase> existing = partPurchaseRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long count = existing.stream()
                .filter(p -> p.getVoucherNo() != null
                        && p.getVoucherNo().startsWith("PP-" + year))
                .count();
        return String.format("PP-%d-%04d", year, count + 1);
    }
}
