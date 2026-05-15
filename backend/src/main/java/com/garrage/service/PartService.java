package com.garrage.service;

import com.garrage.dto.request.CreatePartRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Part;
import com.garrage.repository.PartRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class PartService {

    private final PartRepository partRepository;

    public Part createPart(CreatePartRequest request, String garageId) {
        log.info("Creating part '{}' for garage {}", request.getName(), garageId);
        Part part = Part.builder()
                .garageId(garageId)
                .name(request.getName())
                .partNumber(request.getPartNumber())
                .brand(request.getBrand())
                .category(request.getCategory())
                .mrp(request.getMrp())
                .sellingPrice(request.getSellingPrice())
                .purchasePrice(request.getPurchasePrice())
                .stockQty(request.getStockQty())
                .minStockQty(request.getMinStockQty())
                .rackNumber(request.getRackNumber())
                .hsnCode(request.getHsnCode())
                .gstRate(request.getGstRate())
                .unit(request.getUnit())
                .build();
        return partRepository.save(part);
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
        part.setRackNumber(request.getRackNumber());
        part.setHsnCode(request.getHsnCode());
        part.setGstRate(request.getGstRate());
        part.setUnit(request.getUnit());

        return partRepository.save(part);
    }

    public Part updatePartFromModel(String id, Part request, String garageId) {
        log.info("Updating part {} (partial) for garage {}", id, garageId);
        Part part = partRepository.findByIdAndGarageId(id, garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Part not found with id: " + id));

        if (request.getName() != null) part.setName(request.getName());
        if (request.getPartNumber() != null) part.setPartNumber(request.getPartNumber());
        if (request.getBrand() != null) part.setBrand(request.getBrand());
        if (request.getCategory() != null) part.setCategory(request.getCategory());
        if (request.getMrp() != 0) part.setMrp(request.getMrp());
        if (request.getSellingPrice() != 0) part.setSellingPrice(request.getSellingPrice());
        if (request.getPurchasePrice() != 0) part.setPurchasePrice(request.getPurchasePrice());
        if (request.getStockQty() != 0) part.setStockQty(request.getStockQty());
        if (request.getMinStockQty() != 0) part.setMinStockQty(request.getMinStockQty());
        if (request.getRackNumber() != null) part.setRackNumber(request.getRackNumber());
        if (request.getHsnCode() != null) part.setHsnCode(request.getHsnCode());
        if (request.getGstRate() != 0) part.setGstRate(request.getGstRate());
        if (request.getUnit() != null) part.setUnit(request.getUnit());

        return partRepository.save(part);
    }

    public List<Part> getLowStockParts(String garageId) {
        log.info("Fetching low-stock parts for garage {}", garageId);
        return partRepository.findByGarageId(garageId).stream()
                .filter(part -> part.getStockQty() <= part.getMinStockQty())
                .collect(Collectors.toList());
    }
}
