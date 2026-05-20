package com.garrage.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "part_purchases")
public class PartPurchase {

    @Id
    private String id;

    private String garageId;

    private String voucherNo;

    private String vendorId;
    private String vendorName;

    private String repairOrderId;
    private String repairOrderJobCard;

    private double amount;

    private String date;

    private String comment;

    /** "PAID" or "CREDIT" */
    private String paidStatus;

    /** Only applicable when paidStatus = CREDIT */
    private double advancePaidAmount;

    private String paymentChannel;

    private String paymentDate;

    private String referenceNumber;

    private boolean gstApplicable;
    private double gstRate;
    private double cgst;
    private double sgst;
    private double igst;
    private String hsnSac;
    private String placeOfSupply;

    /** Base64 data URL of attached receipt image */
    private String imageUrl;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
