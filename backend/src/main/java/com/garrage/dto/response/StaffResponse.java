package com.garrage.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffResponse {

    private String id;
    private String phone;
    private String name;
    private String email;
    private String staffTitle;
    private String garageRoleId;
    private String roleName;
    private List<String> permissions;
    @JsonProperty("isActive")
    private boolean isActive;
    private String createdAt;
}
