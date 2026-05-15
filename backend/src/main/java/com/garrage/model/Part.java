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
@Document(collection = "parts")
public class Part {

    @Id
    private String id;

    private String garageId;

    private String name;

    private String partNumber;

    private String brand;

    private String category;

    private double mrp;

    private double sellingPrice;

    private double purchasePrice;

    private int stockQty;

    private int minStockQty;

    private String rackNumber;

    private String hsnCode;

    private double gstRate;

    private String unit;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
