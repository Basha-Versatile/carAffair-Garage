package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {

    @NotBlank
    private String phone;

    @NotBlank
    private String otp;

    private String role = "garage_admin";
}
