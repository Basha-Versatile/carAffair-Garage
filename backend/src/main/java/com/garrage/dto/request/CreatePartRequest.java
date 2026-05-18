package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class CreatePartRequest {

    @NotBlank
    private String name;

    private String partNumber;

    private String brand;

    private String category;

    private String categoryId;

    private String manufacturerId;

    private String manufacturerName;

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

    private boolean isGeneric;

    private List<ApplicableBrandDto> applicableBrands;

    @Data
    public static class ApplicableBrandDto {
        private String brandId;
        private String brandName;
        private List<String> modelIds;
        private List<String> modelNames;
    }
}
