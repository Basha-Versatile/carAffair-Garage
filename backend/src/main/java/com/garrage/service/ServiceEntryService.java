package com.garrage.service;

import com.garrage.model.ServiceEntry;
import com.garrage.repository.ServiceEntryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServiceEntryService {

    private final ServiceEntryRepository serviceEntryRepository;

    public List<ServiceEntry> getServices(String garageId) {
        return serviceEntryRepository.findByGarageId(garageId);
    }

    public ServiceEntry createService(ServiceEntry serviceEntry, String garageId) {
        serviceEntry.setGarageId(garageId);
        return serviceEntryRepository.save(serviceEntry);
    }

    public ServiceEntry updateService(String id, ServiceEntry updates, String garageId) {
        ServiceEntry existing = serviceEntryRepository.findById(id)
                .orElseThrow(() -> new com.garrage.exception.ResourceNotFoundException("Service not found: " + id));
        if (!garageId.equals(existing.getGarageId())) {
            throw new IllegalArgumentException("Service does not belong to this garage");
        }
        if (updates.getName() != null) existing.setName(updates.getName());
        if (updates.getPrice() > 0) existing.setPrice(updates.getPrice());
        if (updates.getCategoryId() != null) existing.setCategoryId(updates.getCategoryId());
        if (updates.getCategoryName() != null) existing.setCategoryName(updates.getCategoryName());
        if (updates.getSacNumber() != null) existing.setSacNumber(updates.getSacNumber());
        existing.setGstRate(updates.getGstRate());
        existing.setHasGst(updates.isHasGst());
        existing.setGeneric(updates.isGeneric());
        if (updates.getApplicableBrands() != null) existing.setApplicableBrands(updates.getApplicableBrands());
        return serviceEntryRepository.save(existing);
    }

    public List<ServiceEntry> getByCategory(String categoryId, String garageId) {
        return serviceEntryRepository.findByGarageIdAndCategoryId(garageId, categoryId);
    }
}
