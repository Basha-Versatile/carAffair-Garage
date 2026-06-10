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
@Document(collection = "attendance")
@CompoundIndex(name = "idx_garage_staff_date", def = "{'garageId': 1, 'staffId': 1, 'date': 1}", unique = true)
public class Attendance {

    @Id
    private String id;

    @Indexed
    private String garageId;

    @Indexed
    private String staffId;

    private String staffName;

    /** Format: "YYYY-MM-DD" */
    private String date;

    // ─── Check-in ───

    private LocalDateTime checkinTime;
    private double checkinLat;
    private double checkinLng;
    /** GridFS ID for check-in selfie */
    private String checkinPhotoId;
    private boolean inUniform;

    // ─── Check-out ───

    private LocalDateTime checkoutTime;
    private double checkoutLat;
    private double checkoutLng;
    /** GridFS ID for check-out selfie */
    private String checkoutPhotoId;

    // ─── Computed ───

    /** Minutes worked: checkout - checkin */
    private long totalWorkMinutes;

    /** "checked_in", "checked_out", "absent" */
    private String status;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;
}
