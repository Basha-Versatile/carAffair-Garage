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

    /** "open", "wip", "ready", "payment_due", "completed" */
    private String status;

    private double amount;

    /** Format: "YYYY-MM-DD" */
    private String date;

    private List<String> services;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
