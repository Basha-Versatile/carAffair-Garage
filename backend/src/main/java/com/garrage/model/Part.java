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
import java.util.List;

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

    /** Legacy brand string (kept for backward compat) */
    private String brand;

    /** Legacy category string (kept for backward compat) */
    private String category;

    /** Reference to PartCategory */
    private String categoryId;

    /** Reference to Manufacturer */
    private String manufacturerId;

    private String manufacturerName;

    /** Reference to TaxProfile (type=goods) */
    private String taxProfileId;

    private double mrp;

    private double sellingPrice;

    private double purchasePrice;

    private int stockQty;

    private int minStockQty;

    private int maxStockQty;

    private String preferredVendorId;

    private String preferredVendorName;

    private String rackNumber;

    private String hsnCode;

    private double gstRate;

    private String unit;

    private String comment;

    /** true = fits all vehicles, false = specific brands/models */
    private boolean isGeneric;

    private List<ApplicableBrand> applicableBrands;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicableBrand {
        private String brandId;
        private String brandName;
        private List<String> modelIds;
        private List<String> modelNames;
    }
}
