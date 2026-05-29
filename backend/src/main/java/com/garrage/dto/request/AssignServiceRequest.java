package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AssignServiceRequest {
    @NotBlank
    private String lineItemId;
    @NotBlank
    private String staffUserId;
    @NotBlank
    private String staffUserName;
}
