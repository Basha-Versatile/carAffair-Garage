package com.garrage.service;

import com.garrage.model.Manufacturer;
import com.garrage.repository.ManufacturerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ManufacturerService {

    private final ManufacturerRepository manufacturerRepository;

    public List<Manufacturer> getManufacturers(String garageId) {
        return manufacturerRepository.findByGarageId(garageId);
    }

    public Manufacturer createManufacturer(String name, String garageId) {
        return manufacturerRepository.findByNameIgnoreCaseAndGarageId(name, garageId)
                .orElseGet(() -> {
                    Manufacturer m = Manufacturer.builder()
                            .garageId(garageId)
                            .name(name)
                            .build();
                    return manufacturerRepository.save(m);
                });
    }
}
