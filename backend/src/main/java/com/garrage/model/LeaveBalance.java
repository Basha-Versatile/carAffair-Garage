package com.garrage.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leave_balances")
@CompoundIndex(name = "idx_garage_staff_year", def = "{'garageId': 1, 'staffId': 1, 'year': 1}", unique = true)
public class LeaveBalance {

    @Id
    private String id;

    @Indexed
    private String garageId;

    @Indexed
    private String staffId;

    /** "2026" */
    private String year;

    @Builder.Default
    private int casualTotal = 12;
    @Builder.Default
    private int casualUsed = 0;

    @Builder.Default
    private int sickTotal = 6;
    @Builder.Default
    private int sickUsed = 0;

    @Builder.Default
    private int earnedTotal = 15;
    @Builder.Default
    private int earnedUsed = 0;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
