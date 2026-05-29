package com.garrage.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GarageResponse {

    private String id;

    private String name;

    private String ownerName;

    private String gstNumber;

    private String email;

    private String phone;

    private String address;

    private String state;

    private String city;

    private String streetAddress;

    private Double latitude;

    private Double longitude;

    @JsonProperty("isActive")
    private boolean isActive;

    private String adminUserId;

    private String createdAt;

    private String updatedAt;
}
