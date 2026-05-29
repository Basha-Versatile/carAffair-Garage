package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "vehicle_analytics")
@CompoundIndex(name = "garage_brand_idx", def = "{'garageId': 1, 'brandId': 1}", unique = true)
public class VehicleAnalytics {

    @Id
    private String id;

    private String garageId;

    private String brandId;

    private String brandName;

    /** Number of unique vehicles serviced for this brand in this garage */
    private long count;

    @LastModifiedDate
    private LocalDateTime lastUpdatedAt;
}
