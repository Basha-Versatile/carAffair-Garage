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
@Document(collection = "vendors")
public class Vendor {

    @Id
    private String id;

    /** null for portal signups */
    private String garageId;

    /** Business / garage name */
    private String name;

    private String ownerName;

    private String phone;

    private String email;

    private String address;

    private String gstin;

    private String pan;

    private String referenceId;

    /** Brands they supply */
    private List<String> brands;

    private List<String> specialties;

    private int experience;

    private String location;

    private int bays;

    private String certifications;

    /** "pending", "approved", "rejected" */
    private String status;

    /** "admin", "portal" */
    private String source;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
