package com.garrage.service;

import com.garrage.dto.request.CreatePartRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Part;
import com.garrage.model.StockHistory;
import com.garrage.repository.PartRepository;
import com.garrage.repository.StockHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;
    private final StockHistoryRepository stockHistoryRepository;
    private final ActivityLogService activityLogService;

    public Part createPart(CreatePartRequest request, String garageId) {
        log.info("Creating part '{}' for garage {}", request.getName(), garageId);

        List<Part.ApplicableBrand> brands = null;
        if (request.getApplicableBrands() != null) {
            brands = request.getApplicableBrands().stream()
                    .map(b -> Part.ApplicableBrand.builder()
                            .brandId(b.getBrandId())
                            .brandName(b.getBrandName())
                            .modelIds(b.getModelIds())
                            .modelNames(b.getModelNames())
                            .build())
                    .collect(Collectors.toList());
        }

        Part part = Part.builder()
                .garageId(garageId)
                .name(request.getName())
                .partNumber(request.getPartNumber())
                .brand(request.getBrand())
                .category(request.getCategory())
                .categoryId(request.getCategoryId())
                .manufacturerId(request.getManufacturerId())
                .manufacturerName(request.getManufacturerName())
                .taxProfileId(request.getTaxProfileId())
                .mrp(request.getMrp())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .stockQty(request.getStockQty())
                .minStockQty(request.getMinStockQty())
                .maxStockQty(request.getMaxStockQty())
                .preferredVendorId(request.getPreferredVendorId())
                .preferredVendorName(request.getPreferredVendorName())
                .rackNumber(request.getRackNumber())
                .hsnCode(request.getHsnCode())
                .gstRate(request.getGstRate())
                .unit(request.getUnit())
                .comment(request.getComment())
                .isGeneric(request.isGeneric())
                .applicableBrands(brands)
                .build();
        Part saved = partRepository.save(part);

        // Record initial stock history if stockQty > 0
        if (request.getStockQty() > 0) {
            StockHistory history = StockHistory.builder()
                    .garageId(garageId)
                    .partId(saved.getId())
                    .partName(saved.getName())
                    .partNumber(saved.getPartNumber())
                    .date(LocalDate.now().toString())
                    .type("stockin")
                    .qty(request.getStockQty())
                    .mode("manual")
                    .comment("Initial stock on part creation")
                    .build();
            stockHistoryRepository.save(history);
        }

        activityLogService.log("CREATE", "PART", saved.getId(),
                "created part " + saved.getName());
        return saved;
    }

    public List<Part> getParts(String garageId) {
        log.info("Fetching all parts for garage {}", garageId);
        return partRepository.findByGarageId(garageId);
    }

    public Part getPartById(String id, String garageId) {
        log.info("Fetching part {} for garage {}", id, garageId);
        return partRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));
    }

    public Part updatePart(String id, CreatePartRequest request, String garageId) {
        log.info("Updating part {} for garage {}", id, garageId);
        Part part = partRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));

        part.setName(request.getName());
        part.setPartNumber(request.getPartNumber());
        part.setBrand(request.getBrand());
        part.setCategory(request.getCategory());
        part.setMrp(request.getMrp());
        part.setSellingPrice(request.getSellingPrice());
        part.setPurchasePrice(request.getPurchasePrice());
        part.setStockQty(request.getStockQty());
        part.setMinStockQty(request.getMinStockQty());
        part.setMaxStockQty(request.getMaxStockQty());
        part.setPreferredVendorId(request.getPreferredVendorId());
        part.setPreferredVendorName(request.getPreferredVendorName());
        part.setRackNumber(request.getRackNumber());
        part.setHsnCode(request.getHsnCode());
        part.setGstRate(request.getGstRate());
        part.setUnit(request.getUnit());
        part.setComment(request.getComment());

        Part saved = partRepository.save(part);
        activityLogService.log("UPDATE", "PART", saved.getId(),
                "updated part " + saved.getName());
        return saved;
    }

    public Part updatePartFromModel(String id, Part request, String garageId) {
        log.info("Updating part {} (partial) for garage {}", id, garageId);
        Part part = partRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));

        int oldStockQty = part.getStockQty();

        if (request.getName() != null) part.setName(request.getName());
        if (request.getPartNumber() != null) part.setPartNumber(request.getPartNumber());
        if (request.getBrand() != null) part.setBrand(request.getBrand());
        if (request.getCategory() != null) part.setCategory(request.getCategory());
        if (request.getMrp() != 0) part.setMrp(request.getMrp());
        if (request.getSellingPrice() != 0) part.setSellingPrice(request.getSellingPrice());
        if (request.getPurchasePrice() != 0) part.setPurchasePrice(request.getPurchasePrice());
        if (request.getStockQty() != 0) part.setStockQty(request.getStockQty());
        if (request.getMinStockQty() != 0) part.setMinStockQty(request.getMinStockQty());
        if (request.getMaxStockQty() != 0) part.setMaxStockQty(request.getMaxStockQty());
        if (request.getPreferredVendorId() != null) part.setPreferredVendorId(request.getPreferredVendorId());
        if (request.getPreferredVendorName() != null) part.setPreferredVendorName(request.getPreferredVendorName());
        if (request.getRackNumber() != null) part.setRackNumber(request.getRackNumber());
        if (request.getHsnCode() != null) part.setHsnCode(request.getHsnCode());
        if (request.getGstRate() != 0) part.setGstRate(request.getGstRate());
        if (request.getUnit() != null) part.setUnit(request.getUnit());
        if (request.getComment() != null) part.setComment(request.getComment());

        Part saved = partRepository.save(part);

        // Record stock history if quantity changed
        int diff = saved.getStockQty() - oldStockQty;
        if (diff != 0) {
            StockHistory history = StockHistory.builder()
                    .garageId(garageId)
                    .partId(saved.getId())
                    .partName(saved.getName())
                    .partNumber(saved.getPartNumber())
                    .date(LocalDate.now().toString())
                    .type(diff > 0 ? "stockin" : "stockout")
                    .qty(Math.abs(diff))
                    .mode("manual")
                    .comment(request.getComment() != null ? request.getComment() : "Stock updated manually")
                    .build();
            stockHistoryRepository.save(history);
        }

        activityLogService.log("UPDATE", "PART", saved.getId(),
                "updated part " + saved.getName());
        return saved;
    }

    public List<Part> getLowStockParts(String garageId) {
        log.info("Fetching low-stock parts for garage {}", garageId);
        return partRepository.findByGarageId(garageId).stream()
                .filter(part -> part.getStockQty() <= part.getMinStockQty())
                .collect(Collectors.toList());
    }
}
