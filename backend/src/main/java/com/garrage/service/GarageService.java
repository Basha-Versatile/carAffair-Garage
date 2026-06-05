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
import com.garrage.repository.BrandRequestRepository;
import com.garrage.repository.CustomerRepository;
import com.garrage.repository.GarageRegistrationRepository;
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
    private final GarageRegistrationRepository garageRegistrationRepository;
    private final BrandRequestRepository brandRequestRepository;
    private final EmailService emailService;

    /**
     * Creates a new garage and its admin user.
     * 1. Create User with role "garage_admin"
     * 2. Create Garage with adminUserId
     * 3. Update user's garageId and garageName
     */
    public GarageResponse createGarage(CreateGarageRequest request) {
        // Validate phone
        if (request.getPhone() != null && !request.getPhone().isBlank()) {
            if (garageRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("A garage with phone number " + request.getPhone() + " already exists. Please use a different phone number.");
            }
            if (userRepository.existsByPhone(request.getPhone())) {
                throw new IllegalArgumentException("Phone number " + request.getPhone() + " is already registered. Please use a different phone number.");
            }
        }

        // Validate email
        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (garageRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("A garage with email " + request.getEmail() + " already exists. Please use a different email address.");
            }
            if (userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email " + request.getEmail() + " is already registered. Please use a different email address.");
            }
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
                .state(request.getState())
                .city(request.getCity())
                .streetAddress(request.getStreetAddress())
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
        garage.setState(request.getState());
        garage.setCity(request.getCity());
        garage.setStreetAddress(request.getStreetAddress());
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

    /**
     * Returns platform-wide stats for the super admin dashboard.
     */
    public Map<String, Object> getSuperAdminStats() {
        List<Garage> allGarages = garageRepository.findAll();
        long activeGarages = allGarages.stream().filter(Garage::isActive).count();
        long inactiveGarages = allGarages.size() - activeGarages;

        long pendingGarageRequests = garageRegistrationRepository.findByStatus("PENDING").size();
        long approvedGarageRequests = garageRegistrationRepository.findByStatus("APPROVED").size();
        long rejectedGarageRequests = garageRegistrationRepository.findByStatus("REJECTED").size();

        long pendingBrandRequests = brandRequestRepository.findByStatus("PENDING").size();
        long approvedBrandRequests = brandRequestRepository.findByStatus("APPROVED").size();
        long rejectedBrandRequests = brandRequestRepository.findByStatus("REJECTED").size();

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalGarages", (long) allGarages.size());
        stats.put("activeGarages", activeGarages);
        stats.put("inactiveGarages", inactiveGarages);
        stats.put("totalGarageRequests", pendingGarageRequests + approvedGarageRequests + rejectedGarageRequests);
        stats.put("pendingGarageRequests", pendingGarageRequests);
        stats.put("approvedGarageRequests", approvedGarageRequests);
        stats.put("rejectedGarageRequests", rejectedGarageRequests);
        stats.put("totalBrandRequests", pendingBrandRequests + approvedBrandRequests + rejectedBrandRequests);
        stats.put("pendingBrandRequests", pendingBrandRequests);
        stats.put("approvedBrandRequests", approvedBrandRequests);
        stats.put("rejectedBrandRequests", rejectedBrandRequests);

        return stats;
    }

    /**
     * Toggles the active status of a garage.
     */
    public GarageResponse toggleGarageActive(String garageId) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Garage not found with id: " + garageId));

        garage.setActive(!garage.isActive());
        garage = garageRepository.save(garage);

        log.info("Garage {} (id: {}) is now {}", garage.getName(), garage.getId(),
                garage.isActive() ? "active" : "inactive");

        return toGarageResponse(garage);
    }

    /**
     * Updates the logo file ID for a garage.
     */
    public GarageResponse updateGarageLogo(String garageId, String logoFileId) {
        Garage garage = garageRepository.findById(garageId)
                .orElseThrow(() -> new ResourceNotFoundException("Garage not found with id: " + garageId));

        garage.setLogoFileId(logoFileId);
        garage = garageRepository.save(garage);

        log.info("Garage logo updated: {} (id: {})", garage.getName(), garage.getId());

        return toGarageResponse(garage);
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
                .state(garage.getState())
                .city(garage.getCity())
                .streetAddress(garage.getStreetAddress())
                .logoFileId(garage.getLogoFileId())
                .latitude(garage.getLatitude())
                .longitude(garage.getLongitude())
                .isActive(garage.isActive())
                .adminUserId(garage.getAdminUserId())
                .createdAt(garage.getCreatedAt() != null ? garage.getCreatedAt().toString() : null)
                .updatedAt(garage.getUpdatedAt() != null ? garage.getUpdatedAt().toString() : null)
                .build();
    }
}
