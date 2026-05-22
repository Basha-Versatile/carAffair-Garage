package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateStaffRequest {

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Name is required")
    private String name;

    private String email;

    /** Display label, e.g. "Front Desk" */
    private String staffTitle;

    @NotBlank(message = "Role assignment is required")
    private String garageRoleId;
}
