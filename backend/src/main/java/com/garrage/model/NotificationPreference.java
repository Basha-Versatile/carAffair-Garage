package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "notification_preferences")
public class NotificationPreference {

    @Id
    private String id;

    @Indexed(unique = true)
    private String userId;

    private String garageId;

    @Builder.Default
    private boolean inventoryEnabled = true;

    @Builder.Default
    private boolean appointmentsEnabled = true;

    @Builder.Default
    private boolean paymentsEnabled = true;

    @Builder.Default
    private boolean staffEnabled = true;

    @Builder.Default
    private boolean systemEnabled = true;

    @Builder.Default
    private boolean pushEnabled = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
