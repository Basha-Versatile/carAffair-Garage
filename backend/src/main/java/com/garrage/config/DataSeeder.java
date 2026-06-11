package com.garrage.config;

import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.garrage.model.Brand;
import com.garrage.model.Garage;
import com.garrage.model.User;
import com.garrage.model.VehicleModel;
import com.garrage.repository.BrandRepository;
import com.garrage.repository.GarageRepository;
import com.garrage.repository.UserRepository;
import com.garrage.repository.VehicleModelRepository;
import com.garrage.service.GarageRoleService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final BrandRepository brandRepository;
    private final VehicleModelRepository vehicleModelRepository;
    private final UserRepository userRepository;
    private final GarageRepository garageRepository;
    private final GarageRoleService garageRoleService;

    @Override
    public void run(String... args) {
        seedBrands();
        seedSuperAdmin();
        seedGarageRoles();
        garageRoleService.migrateAndSyncPermissions();
    }

    /**
     * Seeds brand and vehicle model reference data if the brands collection is empty.
     */
    private void seedBrands() {
        if (brandRepository.count() > 0) {
            log.info("Brands already seeded, skipping.");
            return;
        }

        List<String> brandNames = Arrays.asList(
                "AMC", "Audi", "Ashok Leyland", "BMW", "BYD",
                "Chevrolet", "Citroen", "Datsun", "Fiat", "Force",
                "Ford", "Honda", "Hyundai", "Isuzu", "Jaguar",
                "Jeep", "Kia", "Lamborghini", "Land Rover", "Lexus",
                "Mahindra", "Mahindra Ren.", "Maruti Suzuki", "Mercedes", "MG",
                "Mini", "Mitsubishi", "Nissan", "Opel", "Porsche",
                "Renault", "Rolls Royce", "Skoda", "Tata", "Toyota",
                "Volkswagen", "Volvo"
        );

        // Save all brands and build a name-to-id map for model seeding
        Map<String, String> brandIdMap = new HashMap<>();
        for (String name : brandNames) {
            Brand brand = Brand.builder().name(name).build();
            brand = brandRepository.save(brand);
            brandIdMap.put(name, brand.getId());
        }

        log.info("Seeded {} brands.", brandNames.size());

        // Seed popular vehicle models
        seedVehicleModels(brandIdMap);
    }

    /**
     * Seeds popular vehicle models linked to their brands.
     */
    private void seedVehicleModels(Map<String, String> brandIdMap) {
        if (vehicleModelRepository.count() > 0) {
            log.info("Vehicle models already seeded, skipping.");
            return;
        }

        List<VehicleModel> models = Arrays.asList(
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Maruti Suzuki"))
                        .name("Swift")
                        .fuelType("Petrol")
                        .category("Hatchback")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Maruti Suzuki"))
                        .name("Baleno")
                        .fuelType("Petrol")
                        .category("Hatchback")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Hyundai"))
                        .name("i20")
                        .fuelType("Petrol")
                        .category("Hatchback")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Hyundai"))
                        .name("Creta")
                        .fuelType("Diesel")
                        .category("SUV")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Honda"))
                        .name("City")
                        .fuelType("Petrol")
                        .category("Sedan")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Tata"))
                        .name("Nexon")
                        .fuelType("Petrol")
                        .category("SUV")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Toyota"))
                        .name("Innova")
                        .fuelType("Diesel")
                        .category("VAN")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Kia"))
                        .name("Seltos")
                        .fuelType("Petrol")
                        .category("SUV")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("BMW"))
                        .name("3 Series")
                        .fuelType("Petrol")
                        .category("Luxury")
                        .build(),
                VehicleModel.builder()
                        .brandId(brandIdMap.get("Mercedes"))
                        .name("C-Class")
                        .fuelType("Diesel")
                        .category("Luxury")
                        .build()
        );

        vehicleModelRepository.saveAll(models);
        log.info("Seeded {} vehicle models.", models.size());
    }

    /**
     * Seeds a default super admin user if none exists.
     */
    private void seedSuperAdmin() {
        boolean superAdminExists = userRepository.findFirstByPhoneAndRole("9999999999", "super_admin").isPresent();

        if (superAdminExists) {
            log.info("Super admin already exists, skipping.");
            return;
        }

        User superAdmin = User.builder()
                .phone("9999999999")
                .name("Super Admin")
                .role("super_admin")
                .isActive(true)
                .build();
        userRepository.save(superAdmin);

        log.info("Seeded super admin user with phone: 9999999999");
    }

    /**
     * Seeds default roles for all existing garages that don't have roles yet.
     */
    private void seedGarageRoles() {
        List<Garage> garages = garageRepository.findAll();
        int seeded = 0;
        for (Garage garage : garages) {
            try {
                garageRoleService.seedDefaultRoles(garage.getId());
                seeded++;
            } catch (Exception e) {
                log.warn("Failed to seed roles for garage {}: {}", garage.getId(), e.getMessage());
            }
        }
        log.info("Checked {} garages for default role seeding.", garages.size());
    }
}
