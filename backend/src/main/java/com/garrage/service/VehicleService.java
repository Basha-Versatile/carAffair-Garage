package com.garrage.service;

import com.garrage.dto.request.CreateVehicleRequest;
import com.garrage.model.Brand;
import com.garrage.model.Vehicle;
import com.garrage.model.VehicleModel;
import com.garrage.repository.BrandRepository;
import com.garrage.repository.VehicleModelRepository;
import com.garrage.repository.VehicleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final BrandRepository brandRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final ActivityLogService activityLogService;

    public Vehicle createVehicle(CreateVehicleRequest request, String garageId) {
        // Resolve brandName from brandId if not provided
        String brandName = request.getBrandName();
        String brandId = request.getBrandId();
        if ((brandName == null || brandName.isBlank()) && brandId != null) {
            brandName = brandRepository.findById(brandId)
                    .map(Brand::getName)
                    .orElse(null);
        }

        // Resolve modelName from modelId if not provided
        String modelName = request.getModelName();
        String modelId = request.getModelId();
        String fuelType = request.getFuelType();
        String category = request.getCategory();
        if ((modelName == null || modelName.isBlank()) && modelId != null) {
            Optional<VehicleModel> model = vehicleModelRepository.findById(modelId);
            if (model.isPresent()) {
                modelName = model.get().getName();
                if (fuelType == null || fuelType.isBlank()) fuelType = model.get().getFuelType();
                if (category == null || category.isBlank()) category = model.get().getCategory();
            }
        }

        Vehicle vehicle = Vehicle.builder()
                .garageId(garageId)
                .customerId(request.getCustomerId())
                .registrationNumber(request.getRegistrationNumber())
                .brandId(brandId)
                .brandName(brandName)
                .modelId(modelId)
                .modelName(modelName)
                .fuelType(fuelType)
                .category(category)
                .year(request.getYear())
                .purchaseDate(request.getPurchaseDate())
                .engineNumber(request.getEngineNumber())
                .vinNumber(request.getVinNumber())
                .insuranceProvider(request.getInsuranceProvider())
                .insurerGstin(request.getInsurerGstin())
                .insurerAddress(request.getInsurerAddress())
                .policyNumber(request.getPolicyNumber())
                .insuranceExpiry(request.getInsuranceExpiry())
                .build();
        Vehicle saved = vehicleRepository.save(vehicle);
        activityLogService.log("CREATE", "VEHICLE", saved.getId(),
                "created vehicle " + saved.getRegistrationNumber());
        return saved;
    }

    public List<Vehicle> getVehicles(String garageId) {
        return vehicleRepository.findByGarageId(garageId);
    }

    public Optional<Vehicle> searchByRegNumber(String regNumber, String garageId) {
        return vehicleRepository.findByRegistrationNumberAndGarageId(regNumber, garageId);
    }

    public List<Vehicle> searchVehicles(String regNumber, String garageId) {
        // Try exact match first
        Optional<Vehicle> exact = vehicleRepository.findByRegistrationNumberAndGarageId(regNumber, garageId);
        if (exact.isPresent()) {
            return List.of(exact.get());
        }
        // Fall back to partial/contains match
        return vehicleRepository.findByRegistrationNumberContainingIgnoreCaseAndGarageId(regNumber, garageId);
    }

    public List<Vehicle> getVehiclesByCustomer(String customerId, String garageId) {
        return vehicleRepository.findByCustomerIdAndGarageId(customerId, garageId);
    }
}
