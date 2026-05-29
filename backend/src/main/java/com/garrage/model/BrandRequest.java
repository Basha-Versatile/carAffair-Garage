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
@Document(collection = "brand_requests")
public class BrandRequest {

    @Id
    private String id;

    private String name;

    private String garageId;
    private String garageName;
    private String requestedByUserId;

    @Builder.Default
    private String status = "PENDING";

    private String rejectionReason;

    /** The Brand document id created immediately on submission (no logo). */
    private String approvedBrandId;

    /** GridFS file id for the logo assigned by super admin on approval. */
    private String logoFileId;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
