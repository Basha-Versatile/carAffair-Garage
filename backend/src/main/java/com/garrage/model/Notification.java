package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String garageId;

    @Indexed
    private String recipientUserId;  // specific userId or "all" for garage-wide

    private String recipientRole;    // "garage_admin", "garage_staff", etc.

    private String type;             // STOCK_LOW, STOCK_IN, BOOKING_NEW, SERVICE_READY, etc.
    private String category;         // INVENTORY, APPOINTMENTS, PAYMENTS, STAFF, SYSTEM
    private String priority;         // low, normal, high, urgent

    private String title;
    private String message;
    private String actionUrl;        // frontend route to navigate to

    private String entityType;       // ORDER, INVOICE, PART, etc.
    private String entityId;

    @Builder.Default
    private boolean read = false;

    @CreatedDate
    @Indexed(expireAfter = "P30D")
    private LocalDateTime createdAt;

    private LocalDateTime readAt;
}
