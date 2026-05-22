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
@Document(collection = "activity_logs")
public class ActivityLog {

    @Id
    private String id;

    @Indexed
    private String garageId;

    private String userId;
    private String userName;
    private String userRole;
    private String staffTitle;

    private String action;       // "CREATE", "UPDATE", "DELETE"
    private String entityType;   // "ORDER", "INVOICE", "VEHICLE", "CUSTOMER", etc.
    private String entityId;
    private String description;

    @CreatedDate
    @Indexed(expireAfter = "P14D")
    private LocalDateTime createdAt;
}
