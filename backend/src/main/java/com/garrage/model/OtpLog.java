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
@Document(collection = "otp_logs")
public class OtpLog {

    @Id
    private String id;

    private String phone;

    private String otp;

    /** "garage_admin", "customer", "vendor" */
    private String role;

    @Builder.Default
    private boolean verified = false;

    private LocalDateTime expiresAt;

    @CreatedDate
    private LocalDateTime createdAt;
}
