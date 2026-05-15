package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreateVendorRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    private String ownerName;

    private String email;

    private String address;

    private String gstin;

    private String pan;

    private String referenceId;

    private List<String> brands;
}
