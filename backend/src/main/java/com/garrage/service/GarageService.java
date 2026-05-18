package com.garrage.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.garrage.dto.request.CreateGarageRequest;
import com.garrage.dto.response.GarageResponse;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Garage;
import com.garrage.model.Order;
import com.garrage.model.User;
import com.garrage.repository.CustomerRepository;
import com.garrage.repository.GarageRepository;
import com.garrage.repository.OrderRepository;
import com.garrage.repository.UserRepository;
import com.garrage.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class GarageService {

    private final GarageRepository garageRepository;
    private final UserRepository userRepository;
    private final CustomerRepository customerRepository;
    private final VehicleRepository vehicleRepository;
    private final OrderRepository orderRepository;
    private final EmailService emailService;

    /**
     * Creates a new garage and its admin user.
     * 1. Create User with role "garage_admin"
     * 2. Create Garage with adminUserId
     * 3. Update user's garageId and garageName
     */
    public GarageResponse createGarage(CreateGarageRequest request) {
        // Duplicate checks
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            garageRepository.findByPhone(request.getPhone()).ifPresent(g -> {
                throw new IllegalArgumentException("A garage with phone " + request.getPhone() + " already exists");
            });
        }
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            garageRepository.findByEmail(request.getEmail()).ifPresent(g -> {
                throw new IllegalArgumentException("A garage with email " + request.getEmail() + " already exists");
            });
        }

        // 1. Create the admin user for this garage
        User adminUser = User.builder()
                .phone(request.getPhone())
                .name(request.getOwnerName())
                .email(request.getEmail())
                .role("garage_admin")
                .isActive(true)
                .build();
        adminUser = userRepository.save(adminUser);

        // 2. Create the garage with reference to admin user
        Garage garage = Garage.builder()
                .name(request.getName())
                .ownerName(request.getOwnerName())
                .gstNumber(request.getGstNumber())
                .email(request.getEmail())
                .phone(request.getPhone())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isActive(true)
                .adminUserId(adminUser.getId())
                .build();
        garage = garageRepository.save(garage);

        // 3. Update the user with garageId and garageName
        adminUser.setGarageId(garage.getId());
        adminUser.setGarageName(garage.getName());
        userRepository.save(adminUser);

        // Send welcome email to the garage admin (async - won't block)
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            emailService.sendGarageWelcomeEmail(
                    request.getEmail(), garage.getName(), request.getOwnerName(), request.getPhone());
        }

        log.info("Garage created: {} (id: {}), admin user: {}", garage.getName(), garage.getId(), adminUser.getId());

        return toGarageResponse(garage);
    }

    /**
     * Returns all garages.
     */
    public List<GarageResponse> getAllGarages() {
        return garageRepository.findAll().stream()
                .map(this::toGarageResponse)
                .collect(Collectors.toList());
    }

    /**
     * Returns a single garage by id.
     */
    public GarageResponse getGarageById(String id) {
        Garage garage = garageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Garage not found with id: " + id));
        return toGarageResponse(garage);
    }

    /**
     * Updates a garage with the given fields.
     */
    public GarageResponse updateGarage(String id, CreateGarageRequest request) {
        Garage garage = garageRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Garage not found with id: " + id));

        garage.setName(request.getName());
        garage.setOwnerName(request.getOwnerName());
        garage.setGstNumber(request.getGstNumber());
        garage.setEmail(request.getEmail());
        garage.setPhone(request.getPhone());
        garage.setAddress(request.getAddress());
        garage.setLatitude(request.getLatitude());
        garage.setLongitude(request.getLongitude());

        Garage savedGarage = garageRepository.save(garage);

        // Also update the admin user's garageName if name changed
        if (savedGarage.getAdminUserId() != null) {
            userRepository.findById(savedGarage.getAdminUserId()).ifPresent(user -> {
                user.setGarageName(savedGarage.getName());
                userRepository.save(user);
            });
        }

        garage = savedGarage;

        log.info("Garage updated: {} (id: {})", garage.getName(), garage.getId());

        return toGarageResponse(garage);
    }

    /**
     * Returns dashboard stats for the given garage.
     */
    public Map<String, Object> getGarageDashboard(String garageId) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Garage not found with id: " + garageId));

        long totalCustomers = customerRepository.findByGarageId(garageId).size();
        long totalVehicles = vehicleRepository.findByGarageId(garageId).size();

        List<Order> allOrders = orderRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
        long totalOrders = allOrders.size();
        long openOrders = allOrders.stream().filter(o -> "open".equals(o.getStatus())).count();
        long wipOrders = allOrders.stream().filter(o -> "wip".equals(o.getStatus())).count();
        double totalRevenue = allOrders.stream()
                .filter(o -> "completed".equals(o.getStatus()))
                .mapToDouble(Order::getAmount)
                .sum();

        String today = java.time.LocalDate.now().toString();
        long todayOrders = allOrders.stream()
                .filter(o -> today.equals(o.getDate()))
                .count();

        Map<String, Object> dashboard = new HashMap<>();
        dashboard.put("garageId", garage.getId());
        dashboard.put("garageName", garage.getName());
        dashboard.put("isActive", garage.isActive());
        dashboard.put("totalCustomers", totalCustomers);
        dashboard.put("totalVehicles", totalVehicles);
        dashboard.put("totalOrders", totalOrders);
        dashboard.put("openOrders", openOrders);
        dashboard.put("wipOrders", wipOrders);
        dashboard.put("totalRevenue", totalRevenue);
        dashboard.put("todayOrders", todayOrders);

        return dashboard;
    }

    // ---- Private helpers ----

    private GarageResponse toGarageResponse(Garage garage) {
        return GarageResponse.builder()
                .id(garage.getId())
                .name(garage.getName())
                .ownerName(garage.getOwnerName())
                .gstNumber(garage.getGstNumber())
                .email(garage.getEmail())
                .phone(garage.getPhone())
                .address(garage.getAddress())
                .latitude(garage.getLatitude())
                .longitude(garage.getLongitude())
                .isActive(garage.isActive())
                .adminUserId(garage.getAdminUserId())
                .createdAt(garage.getCreatedAt() != null ? garage.getCreatedAt().toString() : null)
                .updatedAt(garage.getUpdatedAt() != null ? garage.getUpdatedAt().toString() : null)
                .build();
    }
}
