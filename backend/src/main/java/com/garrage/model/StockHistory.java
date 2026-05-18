package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "stock_history")
public class StockHistory {

    @Id
    private String id;

    private String garageId;

    private String partId;

    private String partName;

    private String partNumber;

    private String date;

    /** "stockin" or "stockout" */
    private String type;

    /** Positive for stockin, negative for stockout */
    private int qty;

    /** Reference repair order or purchase order number */
    private String refNumber;

    /** Who made the change */
    private String changedBy;

    /** "manual", "stock-in", "counter-sale", "repair-order", "adjustment" */
    private String mode;

    private String comment;

    @CreatedDate
    private LocalDateTime createdAt;
}
