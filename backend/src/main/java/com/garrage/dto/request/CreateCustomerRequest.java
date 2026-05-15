package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateCustomerRequest {

    @NotBlank
    private String name;

    @NotBlank
    private String phone;

    private String email;

    private String address;

    private String gstin;
}
