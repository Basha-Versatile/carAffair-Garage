package com.garrage.dto.request;

import com.garrage.model.Order;
import lombok.Data;

import java.util.List;

@Data
public class SaveEstimateRequest {
    private List<Order.OrderLineItem> lineItems;
    /** "gst" or "proforma" */
    private String estimateType;
    /** Indian state name for GST split */
    private String placeOfSupply;
    /** Format: "YYYY-MM-DD" */
    private String estimatedDeliveryDate;
    private double subtotal;
    private double discountAmount;
    private double cgstAmount;
    private double sgstAmount;
    private double igstAmount;
    private double totalGst;
    private double grandTotal;
}
