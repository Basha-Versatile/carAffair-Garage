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

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "leave_requests")
public class LeaveRequest {

    @Id
    private String id;

    @Indexed
    private String garageId;

    @Indexed
    private String staffId;

    private String staffName;

    /** "casual", "sick", "earned", "unpaid" */
    private String leaveType;

    /** Format: "YYYY-MM-DD" */
    private String startDate;

    /** Format: "YYYY-MM-DD" */
    private String endDate;

    /** Number of days */
    private int days;

    private String reason;

    /** "pending", "approved", "rejected" */
    @Builder.Default
    private String status = "pending";

    /** Admin userId who approved/rejected */
    private String reviewedBy;

    private String reviewerName;

    private String rejectionNote;

    private LocalDateTime reviewedAt;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
