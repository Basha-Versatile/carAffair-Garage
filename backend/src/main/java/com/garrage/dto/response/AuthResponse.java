package com.garrage.dto.response;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String accessToken;

    private String refreshToken;

    private String userId;

    private String name;

    private String phone;

    private String role;

    private String garageId;

    private String garageName;

    /** Only populated for garage_staff users */
    private List<String> permissions;

    /** Only populated for garage_staff users */
    private String garageRoleId;

    /** Only populated for garage_staff users */
    private String staffTitle;
}
