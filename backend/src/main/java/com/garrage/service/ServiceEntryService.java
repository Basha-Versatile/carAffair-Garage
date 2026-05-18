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

    public List<ServiceEntry> getByCategory(String categoryId, String garageId) {
        return serviceEntryRepository.findByGarageIdAndCategoryId(garageId, categoryId);
    }
}
