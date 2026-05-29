package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "garage_registrations")
public class GarageRegistration {

    @Id
    private String id;

    private String name;

    private String ownerName;

    private String email;

    private String phone;

    private String gstNumber;

    private String address;

    private String state;

    private String city;

    private String streetAddress;

    private Double latitude;

    private Double longitude;

    @Builder.Default
    private String status = "PENDING";

    private String rejectionReason;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
