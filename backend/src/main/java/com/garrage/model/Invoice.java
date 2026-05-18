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
@Document(collection = "invoices")
public class Invoice {

    @Id
    private String id;

    private String garageId;

    private String invoiceNumber;

    /** "proforma", "tax" */
    private String type;

    private String repairOrderId;

    private String customerId;

    private String customerName;

    private String customerPhone;

    private List<InvoiceItem> items;

    private List<String> tags;

    private double discount;

    private double totalAmount;

    private double gstAmount;

    private double grandTotal;

    /** "draft", "sent", "paid" */
    private String status;

    private String date;

    private String placeOfSupply;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class InvoiceItem {
        /** "service" or "part" */
        private String itemType;
        private String serviceId;
        private String partId;
        private String description;
        private String hsnSac;
        private int qty;
        private double rate;
        private double discount;
        private double amount;
        private double gstRate;
        private double gstAmount;
        private boolean gstInclusive;
    }
}
