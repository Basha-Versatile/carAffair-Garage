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
@Document(collection = "vehicles")
public class Vehicle {

    @Id
    private String id;

    private String garageId;

    private String customerId;

    private String registrationNumber;

    private String brandId;
    private String brandName;

    private String modelId;
    private String modelName;

    private String fuelType;

    private String category;

    private String year;

    private String purchaseDate;

    private String engineNumber;

    private String vinNumber;

    private String insuranceProvider;

    private String insurerGstin;

    private String insurerAddress;

    private String policyNumber;

    private String insuranceExpiry;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
