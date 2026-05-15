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
@Document(collection = "service_reminders")
public class ServiceReminder {

    @Id
    private String id;

    private String garageId;

    private String customerId;

    private String customerName;

    private String customerPhone;

    private String vehicleNumber;

    private String vehicleName;

    private String serviceType;

    private String dueDate;

    /** "due", "overdue", "done" */
    private String status;

    private String lastServiceDate;

    private Integer kmsDue;

    private String notes;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
