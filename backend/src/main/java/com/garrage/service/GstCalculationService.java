package com.garrage.service;

import com.garrage.model.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class GstCalculationService {

    /**
     * Calculate GST breakdown for order line items.
     *
     * @param items         Line items with qty, rate, discountPercent, gstRate
     * @param estimateType  "gst" or "proforma"
     * @param garageGstNumber Garage GSTIN (first 2 digits = state code)
     * @param placeOfSupply Indian state name from customer
     * @return GstBreakdown with all amounts
     */
    public GstBreakdown calculateGst(List<Order.OrderLineItem> items, String estimateType,
                                      String garageGstNumber, String placeOfSupply) {
        return calculateGst(items, estimateType, garageGstNumber, placeOfSupply, null);
    }

    /**
     * Calculate GST breakdown with optional garage state fallback.
     */
    public GstBreakdown calculateGst(List<Order.OrderLineItem> items, String estimateType,
                                      String garageGstNumber, String placeOfSupply,
                                      String garageState) {

        double subtotal = 0;
        double totalDiscount = 0;
        double totalCgst = 0;
        double totalSgst = 0;
        double totalIgst = 0;

        boolean isProforma = "proforma".equalsIgnoreCase(estimateType);
        // Use GSTIN if available, else fall back to garage state name comparison
        boolean sameState;
        if (garageGstNumber != null && garageGstNumber.length() >= 2) {
            sameState = isSameState(garageGstNumber, placeOfSupply);
        } else {
            sameState = isSameStateByName(garageState, placeOfSupply);
        }

        for (Order.OrderLineItem item : items) {
            double lineAmount = item.getQty() * item.getRate();
            double discount = lineAmount * item.getDiscountPercent() / 100.0;
            double taxableAmount = lineAmount - discount;

            item.setAmount(taxableAmount);

            if (!isProforma && item.getGstRate() > 0) {
                double gstAmount;
                if (sameState) {
                    double halfRate = item.getGstRate() / 2.0;
                    double cgst = taxableAmount * halfRate / 100.0;
                    double sgst = taxableAmount * halfRate / 100.0;
                    gstAmount = cgst + sgst;
                    totalCgst += cgst;
                    totalSgst += sgst;
                } else {
                    gstAmount = taxableAmount * item.getGstRate() / 100.0;
                    totalIgst += gstAmount;
                }
                item.setGstAmount(Math.round(gstAmount * 100.0) / 100.0);
            } else {
                item.setGstAmount(0);
            }

            subtotal += taxableAmount;
            totalDiscount += discount;
        }

        double totalGst = totalCgst + totalSgst + totalIgst;
        double grandTotal = subtotal + totalGst;

        return GstBreakdown.builder()
                .subtotal(round(subtotal))
                .discountAmount(round(totalDiscount))
                .cgstAmount(round(totalCgst))
                .sgstAmount(round(totalSgst))
                .igstAmount(round(totalIgst))
                .totalGst(round(totalGst))
                .grandTotal(round(grandTotal))
                .isSameState(sameState)
                .build();
    }

    /**
     * Determine if the garage and customer are in the same state.
     * Compares first 2 digits of GSTIN with the state code derived from placeOfSupply.
     */
    public boolean isSameState(String garageGstNumber, String placeOfSupply) {
        if (garageGstNumber == null || garageGstNumber.length() < 2 || placeOfSupply == null) {
            return true; // Default to same state (CGST+SGST) if unknown
        }

        String garageStateCode = garageGstNumber.substring(0, 2);
        String supplyStateCode = STATE_CODE_MAP.get(placeOfSupply.trim().toLowerCase());

        if (supplyStateCode == null) {
            return true; // Unknown state, default to same state
        }

        return garageStateCode.equals(supplyStateCode);
    }

    /**
     * Determine if the garage and customer are in the same state using state names.
     * Used as fallback when GSTIN is not available.
     */
    public boolean isSameStateByName(String garageState, String placeOfSupply) {
        if (garageState == null || garageState.isBlank() || placeOfSupply == null || placeOfSupply.isBlank()) {
            return true; // Default to same state if unknown
        }
        return garageState.trim().equalsIgnoreCase(placeOfSupply.trim());
    }

    private double round(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GstBreakdown {
        private double subtotal;
        private double discountAmount;
        private double cgstAmount;
        private double sgstAmount;
        private double igstAmount;
        private double totalGst;
        private double grandTotal;
        private boolean isSameState;
    }

    // Indian state name → 2-digit GSTIN state code
    private static final Map<String, String> STATE_CODE_MAP = Map.ofEntries(
            Map.entry("jammu and kashmir", "01"),
            Map.entry("himachal pradesh", "02"),
            Map.entry("punjab", "03"),
            Map.entry("chandigarh", "04"),
            Map.entry("uttarakhand", "05"),
            Map.entry("haryana", "06"),
            Map.entry("delhi", "07"),
            Map.entry("rajasthan", "08"),
            Map.entry("uttar pradesh", "09"),
            Map.entry("bihar", "10"),
            Map.entry("sikkim", "11"),
            Map.entry("arunachal pradesh", "12"),
            Map.entry("nagaland", "13"),
            Map.entry("manipur", "14"),
            Map.entry("mizoram", "15"),
            Map.entry("tripura", "16"),
            Map.entry("meghalaya", "17"),
            Map.entry("assam", "18"),
            Map.entry("west bengal", "19"),
            Map.entry("jharkhand", "20"),
            Map.entry("odisha", "21"),
            Map.entry("chhattisgarh", "22"),
            Map.entry("madhya pradesh", "23"),
            Map.entry("gujarat", "24"),
            Map.entry("dadra and nagar haveli and daman and diu", "26"),
            Map.entry("maharashtra", "27"),
            Map.entry("andhra pradesh", "37"),
            Map.entry("karnataka", "29"),
            Map.entry("goa", "30"),
            Map.entry("lakshadweep", "31"),
            Map.entry("kerala", "32"),
            Map.entry("tamil nadu", "33"),
            Map.entry("puducherry", "34"),
            Map.entry("andaman and nicobar islands", "35"),
            Map.entry("telangana", "36"),
            Map.entry("ladakh", "38")
    );

    /**
     * Get list of all Indian states/UTs for dropdown.
     */
    public static List<String> getStates() {
        return List.of(
                "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh",
                "Assam", "Bihar", "Chandigarh", "Chhattisgarh",
                "Dadra and Nagar Haveli and Daman and Diu", "Delhi", "Goa",
                "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir",
                "Jharkhand", "Karnataka", "Kerala", "Ladakh", "Lakshadweep",
                "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
                "Nagaland", "Odisha", "Puducherry", "Punjab", "Rajasthan",
                "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
                "Uttarakhand", "West Bengal"
        );
    }
}
