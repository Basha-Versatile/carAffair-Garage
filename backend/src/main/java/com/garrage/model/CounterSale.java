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
@Document(collection = "counter_sales")
public class CounterSale {

    @Id
    private String id;

    private String garageId;

    private String invoiceNumber;

    private String customerName;

    private String customerPhone;

    private String date;

    private String placeOfSupply;

    private List<CSItem> items;

    private List<CSService> services;

    private double totalAmount;

    private double gstAmount;

    private double grandTotal;

    private double discount;

    /** "paid", "pending", "partial" */
    private String paymentStatus;

    private List<String> tags;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CSItem {
        private String partId;
        private String name;
        private int qty;
        private double rate;
        private double amount;
        private double gstRate;
        private double gstAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CSService {
        private String name;
        private int qty;
        private double rate;
        private double amount;
        private double gstRate;
        private double gstAmount;
    }
}
