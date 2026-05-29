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
@Document(collection = "service_packages")
public class ServicePackage {

    @Id
    private String id;

    private String garageId;

    private String name;

    private String description;

    private List<PackageServiceItem> serviceItems;

    private List<PackagePartItem> partItems;

    /** Sum of default rates */
    private double totalEstimate;

    @Builder.Default
    private boolean isActive = true;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackageServiceItem {
        private String serviceId;
        private String serviceName;
        private String hsnSac;
        private int defaultQty;
        private double defaultRate;
        private double gstRate;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PackagePartItem {
        private String partId;
        private String partName;
        private String hsnSac;
        private int defaultQty;
        private double defaultRate;
        private double gstRate;
    }
}
