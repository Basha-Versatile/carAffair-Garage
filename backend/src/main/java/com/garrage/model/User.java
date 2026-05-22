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

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "users")
public class User {

    @Id
    private String id;

    @Indexed(unique = true)
    private String phone;

    private String name;

    private String email;

    /** "super_admin", "garage_admin", "garage_staff", "customer", "vendor" */
    private String role;

    /** null for super_admin and customer */
    private String garageId;

    private String garageName;

    /** Display label for staff, e.g. "Front Desk". Only used for garage_staff. */
    private String staffTitle;

    /** Reference to GarageRole.id. Only used for garage_staff. */
    private String garageRoleId;

    @JsonProperty("isActive")
    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
