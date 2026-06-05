package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "garages")
public class Garage {

    @Id
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

    private String logoFileId;

    private Double latitude;

    private Double longitude;

    @JsonProperty("isActive")
    @Builder.Default
    private boolean isActive = true;

    private String adminUserId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
