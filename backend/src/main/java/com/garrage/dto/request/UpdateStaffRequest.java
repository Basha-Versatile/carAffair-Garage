package com.garrage.dto.request;

import lombok.Data;

@Data
public class UpdateStaffRequest {

    private String name;

    private String email;

    private String staffTitle;

    private String garageRoleId;
}
