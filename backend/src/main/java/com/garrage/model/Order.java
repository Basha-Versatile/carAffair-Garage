package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "repair_orders")
public class Order {

    @Id
    private String id;

    private String garageId;

    /** Format: "JC-2026-001" */
    private String jobCard;

    private String customerId;

    private String customerName;

    private String customerPhone;

    private String vehicleId;

    /** "Brand Model" display name */
    private String vehicle;

    /** Registration number */
    private String vehicleNumber;

    /**
     * "inspection", "estimate_sent", "customer_approved", "customer_rejected",
     * "open", "wip", "ready", "invoiced", "payment_due", "completed"
     */
    private String status;

    private double amount;

    /** Format: "YYYY-MM-DD" */
    private String date;

    /** Legacy: simple service name list (old orders) */
    private List<String> services;

    // ─── Inspection fields ───

    private Long odometerReading;

    /** "empty", "quarter", "half", "three_quarter", "full" */
    private String fuelLevel;

    private String inspectionNotes;

    /** Multiple customer remarks */
    private List<String> customerRemarks;

    /** GridFS file IDs for inspection images */
    private List<String> imageIds;

    private LocalDateTime inspectionCompletedAt;

    // ─── Estimate fields ───

    /** Itemized line items (replaces simple services list for new orders) */
    private List<OrderLineItem> lineItems;

    /** "gst" or "proforma" */
    private String estimateType;

    /** Indian state name for GST split logic */
    private String placeOfSupply;

    private double subtotal;

    private double discountAmount;

    private double cgstAmount;

    private double sgstAmount;

    private double igstAmount;

    private double totalGst;

    private double grandTotal;

    /** Format: "YYYY-MM-DD" */
    private String estimatedDeliveryDate;

    /** UUID for public estimate link */
    @Indexed(unique = true, sparse = true)
    private String estimateToken;

    private LocalDateTime estimateSentAt;

    /** UUID for public payment link */
    @Indexed(unique = true, sparse = true)
    private String paymentToken;

    private LocalDateTime paymentSentAt;

    // ─── Customer response ───

    private Boolean customerApproved;

    private String customerRejectionNote;

    private LocalDateTime customerRespondedAt;

    // ─── Service assignments ───

    private List<ServiceAssignment> serviceAssignments;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // ─── Nested classes ───

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OrderLineItem {
        /** UUID for frontend key */
        private String id;
        /** "service" or "part" */
        private String itemType;
        private String serviceId;
        private String partId;
        /** If added from a package */
        private String packageId;
        private String description;
        private String hsnSac;
        private int qty;
        private double rate;
        private double discountPercent;
        /** qty * rate - discount */
        private double amount;
        /** GST percentage */
        private double gstRate;
        private double gstAmount;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceAssignment {
        /** References OrderLineItem.id */
        private String lineItemId;
        private String assignedUserId;
        private String assignedUserName;
        /** "pending", "in_progress", "completed" */
        private String status;
        private LocalDateTime assignedAt;
        private LocalDateTime completedAt;
        private String notes;
    }
}
