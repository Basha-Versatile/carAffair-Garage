package com.garrage.dto.request;

import lombok.Data;

@Data
public class EstimateResponseRequest {
    private boolean approved;
    private String rejectionNote;
}
