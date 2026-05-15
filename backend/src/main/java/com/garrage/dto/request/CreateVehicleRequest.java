package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateVehicleRequest {

    @NotBlank
    private String customerId;

    @NotBlank
    private String registrationNumber;

    // Accept either IDs (from frontend dropdowns) or names directly
    private String brandId;
    private String brandName;

    private String modelId;
    private String modelName;

    private String fuelType;

    private String category;

    private String year;

    private String purchaseDate;

    private String engineNumber;

    private String vinNumber;

    private String insuranceProvider;

    private String insurerGstin;

    private String insurerAddress;

    private String policyNumber;

    private String insuranceExpiry;
}
