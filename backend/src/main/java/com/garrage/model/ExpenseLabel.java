package com.garrage.model;

import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "expense_labels")
public class ExpenseLabel {

    @Id
    private String id;

    private String garageId;

    private String name;

    @CreatedDate
    private LocalDateTime createdAt;
}
