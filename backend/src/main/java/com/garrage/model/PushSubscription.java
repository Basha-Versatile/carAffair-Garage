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
@Document(collection = "push_subscriptions")
public class PushSubscription {

    @Id
    private String id;

    @Indexed
    private String userId;

    private String garageId;

    private String endpoint;
    private String p256dh;
    private String auth;

    private String userAgent;

    @CreatedDate
    private LocalDateTime createdAt;
}
