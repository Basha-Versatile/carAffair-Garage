package com.garrage.service;

import com.garrage.dto.request.CreateGarageRequest;
import com.garrage.dto.request.GarageRegistrationRequest;
import com.garrage.exception.BadRequestException;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.GarageRegistration;
import com.garrage.repository.GarageRegistrationRepository;
import com.garrage.repository.GarageRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class GarageRegistrationService {

    private final GarageRegistrationRepository registrationRepository;
    private final GarageRepository garageRepository;
    private final UserRepository userRepository;
    private final GarageService garageService;
    private final EmailService emailService;
    private final NotificationService notificationService;

    public GarageRegistration submitRegistration(GarageRegistrationRequest request) {
        // Check phone uniqueness across garages, users, and non-rejected registrations
        if (garageRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("A garage with this phone number already exists.");
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("This phone number is already registered.");
        }
        if (registrationRepository.existsByPhoneAndStatusNot(request.getPhone(), "REJECTED")) {
            throw new BadRequestException("A registration request with this phone number is already pending.");
        }

        // Check email uniqueness
        if (garageRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("A garage with this email already exists.");
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("This email is already registered.");
        }
        if (registrationRepository.existsByEmailAndStatusNot(request.getEmail(), "REJECTED")) {
            throw new BadRequestException("A registration request with this email is already pending.");
        }

        GarageRegistration registration = GarageRegistration.builder()
                .name(request.getName())
                .ownerName(request.getOwnerName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .gstNumber(request.getGstNumber())
                .address(request.getAddress())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .status("PENDING")
                .build();

        registration = registrationRepository.save(registration);
        log.info("Garage registration submitted: {} (id: {})", registration.getName(), registration.getId());

        // Notify super admin about new garage registration
        notificationService.notifySuperAdmin(
                "GARAGE_REQUEST", "SYSTEM", "high",
                "New Garage Registration",
                registration.getName() + " by " + registration.getOwnerName() + " is waiting for approval",
                "/dashboard/super-admin/garage-requests",
                "GARAGE_REGISTRATION", registration.getId());

        return registration;
    }

    public List<GarageRegistration> getAllRegistrations() {
        return registrationRepository.findAllByOrderByCreatedAtDesc();
    }

    public GarageRegistration getRegistrationById(String id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + id));
    }

    public void approveRegistration(String id) {
        GarageRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + id));

        if (!"PENDING".equals(registration.getStatus())) {
            throw new BadRequestException("Only pending registrations can be approved.");
        }

        // Build CreateGarageRequest and delegate to existing GarageService
        CreateGarageRequest garageRequest = new CreateGarageRequest();
        garageRequest.setName(registration.getName());
        garageRequest.setOwnerName(registration.getOwnerName());
        garageRequest.setEmail(registration.getEmail());
        garageRequest.setPhone(registration.getPhone());
        garageRequest.setGstNumber(registration.getGstNumber());
        garageRequest.setAddress(registration.getAddress());
        garageRequest.setLatitude(registration.getLatitude());
        garageRequest.setLongitude(registration.getLongitude());

        garageService.createGarage(garageRequest);

        registration.setStatus("APPROVED");
        registrationRepository.save(registration);

        // Send approval email
        emailService.sendGarageApprovalEmail(
                registration.getEmail(),
                registration.getName(),
                registration.getOwnerName(),
                registration.getPhone());

        log.info("Garage registration approved: {} (id: {})", registration.getName(), registration.getId());
    }

    public void rejectRegistration(String id, String reason) {
        GarageRegistration registration = registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Registration not found with id: " + id));

        if (!"PENDING".equals(registration.getStatus())) {
            throw new BadRequestException("Only pending registrations can be rejected.");
        }

        registration.setStatus("REJECTED");
        registration.setRejectionReason(reason);
        registrationRepository.save(registration);

        // Send rejection email
        emailService.sendGarageRejectionEmail(
                registration.getEmail(),
                registration.getName(),
                registration.getOwnerName(),
                reason);

        log.info("Garage registration rejected: {} (id: {})", registration.getName(), registration.getId());
    }
}
