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

import com.fasterxml.jackson.annotation.JsonProperty;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "garage_roles")
public class GarageRole {

    @Id
    private String id;

    @Indexed
    private String garageId;

    private String name;

    private String description;

    /**
     * Module-level permissions.
     * Format: ["ORDERS:VIEW", "ORDERS:MANAGE", "INVOICES:VIEW", ...]
     */
    private List<String> permissions;

    @JsonProperty("isActive")
    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
