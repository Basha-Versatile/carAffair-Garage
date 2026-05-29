package com.garrage.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class GarageRegistrationRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String ownerName;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;

    private String gstNumber;

    private String address;

    private String state;

    private String city;

    private String streetAddress;

    private Double latitude;

    private Double longitude;
}
