package com.garrage.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class RcLookupResponse {

    // Customer fields
    private String ownerName;
    private String address;
    private String mobileNumber;

    // Vehicle fields (raw from SurePass)
    private String makerDescription;
    private String makerModel;
    private String fuelType;
    private String engineNumber;
    private String chassisNumber;
    private String manufacturingDate;
    private String registrationDate;
    private String color;
    private String bodyType;
    private String vehicleCategory;
    private String rcStatus;

    // Insurance fields
    private String insuranceCompany;
    private String policyNumber;
    private String insuranceUpto;

    // Finance
    private String financer;

    // Brand/Model matching results
    private String matchedBrandId;
    private String matchedBrandName;
    private String matchedModelId;
    private String matchedModelName;
    private String matchedFuelType;
}
