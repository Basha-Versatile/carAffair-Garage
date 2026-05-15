package com.garrage.service;

import com.garrage.model.Brand;
import com.garrage.model.VehicleModel;
import com.garrage.repository.BrandRepository;
import com.garrage.repository.VehicleModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BrandModelService {

    private final BrandRepository brandRepository;
    private final VehicleModelRepository vehicleModelRepository;

    public List<Brand> getAllBrands() {
        return brandRepository.findAll(Sort.by(Sort.Direction.ASC, "name"));
    }

    public List<VehicleModel> getModelsByBrand(String brandId) {
        return vehicleModelRepository.findByBrandId(brandId);
    }

    public List<VehicleModel> getAllModels() {
        return vehicleModelRepository.findAll();
    }

    public VehicleModel addModel(String brandId, String name, String fuelType, String category) {
        VehicleModel model = VehicleModel.builder()
                .brandId(brandId)
                .name(name)
                .fuelType(fuelType)
                .category(category)
                .build();
        return vehicleModelRepository.save(model);
    }
}
