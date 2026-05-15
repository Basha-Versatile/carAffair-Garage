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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "bookings")
public class Booking {

    @Id
    private String id;

    /** Format: "CA-XXXXXX" */
    private String bookingId;

    /** Can be null initially */
    private String garageId;

    /** "general", "ac", "wheel", "denting", "battery", "periodic" */
    private String service;

    private String customerName;

    private String customerPhone;

    private String customerEmail;

    private String address;

    private String vehicleRegNumber;

    private String vehicleBrand;

    private String vehicleModel;

    private String vehicleFuelType;

    private String vehicleYear;

    private String preferredDate;

    private String preferredTime;

    private String concerns;

    private boolean pickDrop;

    /** "pending", "confirmed", "rescheduled", "cancelled", "completed" */
    private String status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
