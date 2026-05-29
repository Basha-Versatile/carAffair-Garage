package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "brands")
public class Brand {

    @Id
    private String id;

    private String name;

    /** GridFS file ID for brand logo (null for brands without logos). */
    private String logoFileId;
}
