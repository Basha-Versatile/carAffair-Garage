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
@Document(collection = "service_entries")
public class ServiceEntry {

    @Id
    private String id;

    private String garageId;

    private String name;

    private double price;

    private String serviceNumber;

    private String categoryId;

    private String categoryName;

    /** true = applies to all vehicles, false = specific brands/models only */
    private boolean isGeneric;

    private List<ApplicableBrand> applicableBrands;

    private boolean hasGst;

    private String taxProfileId;

    private String sacNumber;

    private double gstRate;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ApplicableBrand {
        private String brandId;
        private String brandName;
        private List<String> modelIds;
        private List<String> modelNames;
    }
}
