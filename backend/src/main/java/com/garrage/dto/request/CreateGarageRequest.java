package com.garrage.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateGarageRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String ownerName;

    private String gstNumber;

    @NotBlank
    @Email
    private String email;

    @NotBlank
    private String phone;

    private String address;

    private Double latitude;

    private Double longitude;
}
