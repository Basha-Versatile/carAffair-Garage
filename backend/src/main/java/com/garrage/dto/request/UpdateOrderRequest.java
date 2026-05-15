package com.garrage.dto.request;

import lombok.Data;

@Data
public class UpdateOrderRequest {

    private String status;

    private Double amount;
}
