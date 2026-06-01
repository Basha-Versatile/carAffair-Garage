package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateBookingRequest {

    private String service;

    @NotBlank
    private String customerName;

    @NotBlank
    private String customerPhone;

    @NotBlank
    private String customerEmail;

    private String address;

    @NotBlank
    private String vehicleRegNumber;

    private String vehicleBrand;

    private String vehicleModel;

    private String vehicleFuelType;

    private String vehicleYear;

    @NotBlank
    private String preferredDate;

    @NotBlank
    private String preferredTime;

    private String concerns;

    private String customerMessage;

    private boolean pickDrop;
}
