package com.garrage.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePartRequest {

    @NotBlank
    private String name;

    @NotBlank
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
}
