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
@Document(collection = "stock_in_records")
public class StockInRecord {

    @Id
    private String id;

    private String garageId;

    private String date;

    private String invoiceNumber;

    private String vendorId;

    private String vendorName;

    private boolean isGstBill;

    /** "cash", "bank", "upi", "credit" */
    private String paymentChannel;

    private String placeOfSupply;

    private List<StockInItem> items;

    private double totalAmount;

    private double gstAmount;

    private double grandTotal;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StockInItem {
        private String partId;
        private String partName;
        private String partNumber;
        private int qty;
        private double rate;
        private double amount;
        private double gstRate;
        private double gstAmount;
    }
}
