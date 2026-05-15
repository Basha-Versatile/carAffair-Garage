package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateOrderRequest {

    @NotBlank
    private String customerName;

    @NotBlank
    private String phone;

    @NotBlank
    private String vehicle;

    @NotBlank
    private String vehicleNumber;

    private String customerId;

    private String vehicleId;

    private double amount;

    private List<String> services;
}
