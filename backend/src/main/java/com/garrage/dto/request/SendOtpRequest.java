package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class SendOtpRequest {

    @NotBlank
    private String phone;

    private String role = "garage_admin";
}
