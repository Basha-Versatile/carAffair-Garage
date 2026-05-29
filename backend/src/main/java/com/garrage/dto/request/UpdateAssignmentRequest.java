package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateAssignmentRequest {
    @NotBlank
    private String lineItemId;
    @NotBlank
    private String status;
    private String notes;
}
