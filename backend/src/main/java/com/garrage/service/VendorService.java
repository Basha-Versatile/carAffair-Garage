package com.garrage.service;

import com.garrage.dto.request.CreateVendorRequest;
import com.garrage.dto.request.RegisterVendorRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Vendor;
import com.garrage.repository.VendorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VendorService {

    private final VendorRepository vendorRepository;
    private final ActivityLogService activityLogService;

    public Vendor createVendor(CreateVendorRequest request, String garageId) {
        Vendor vendor = Vendor.builder()
                .garageId(garageId)
                .name(request.getName())
                .ownerName(request.getOwnerName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .address(request.getAddress())
                .gstin(request.getGstin())
                .pan(request.getPan())
                .referenceId(request.getReferenceId())
                .brands(request.getBrands())
                .source("admin")
                .status("approved")
                .build();
        Vendor saved = vendorRepository.save(vendor);
        activityLogService.log("CREATE", "VENDOR", saved.getId(),
                "created vendor " + saved.getName());
        return saved;
    }

    public Vendor registerVendor(RegisterVendorRequest request) {
        Vendor vendor = Vendor.builder()
                .garageId(null)
                .name(request.getGarageName())
                .ownerName(request.getOwnerName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .location(request.getLocation())
                .address(request.getFullAddress())
                .experience(request.getExperience())
                .specialties(request.getSpecialties())
                .bays(request.getBays() != null ? request.getBays() : 0)
                .certifications(request.getCertifications())
                .source("portal")
                .status("pending")
                .build();
        return vendorRepository.save(vendor);
    }

    public List<Vendor> getVendors(String garageId) {
        return vendorRepository.findByGarageId(garageId);
    }

    public List<Vendor> getPendingVendors() {
        return vendorRepository.findBySourceAndStatus("portal", "pending");
    }

    public Vendor approveVendor(String id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        vendor.setStatus("approved");
        Vendor saved = vendorRepository.save(vendor);
        activityLogService.log("UPDATE", "VENDOR", saved.getId(),
                "approved vendor " + saved.getName());
        return saved;
    }

    public Vendor rejectVendor(String id) {
        Vendor vendor = vendorRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Vendor not found with id: " + id));
        vendor.setStatus("rejected");
        Vendor saved = vendorRepository.save(vendor);
        activityLogService.log("UPDATE", "VENDOR", saved.getId(),
                "rejected vendor " + saved.getName());
        return saved;
    }
}
