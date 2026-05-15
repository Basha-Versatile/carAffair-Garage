package com.garrage.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class RegisterVendorRequest {

    @NotBlank
    private String garageName;

    @NotBlank
    private String ownerName;

    @NotBlank
    private String phone;

    @NotBlank
    @Email
    private String email;

    private int experience;

    private List<String> specialties;

    @NotBlank
    private String location;

    private String fullAddress;

    private Integer bays;

    private String certifications;
}
