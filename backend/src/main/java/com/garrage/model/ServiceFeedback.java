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
@Document(collection = "service_feedbacks")
public class ServiceFeedback {

    @Id
    private String id;

    private String garageId;

    private String customerName;

    private String customerPhone;

    private String vehicleNumber;

    private String vehicleName;

    /** Rating from 1 to 5 */
    private int rating;

    private String comment;

    private String date;

    private String jobCard;

    /** "reviewed", "scheduled", "pending" */
    private String status;

    private List<String> services;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
