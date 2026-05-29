package com.garrage.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class InspectionRequest {
    private List<String> customerRemarks;
    private String inspectionNotes;
}
