package com.garrage.service;

import com.garrage.model.Order;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.LinkedHashMap;
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

    // State → major cities mapping
    private static final Map<String, List<String>> STATE_CITIES_MAP;

    static {
        Map<String, List<String>> m = new LinkedHashMap<>();
        m.put("Andaman and Nicobar Islands", List.of("Port Blair", "Diglipur", "Rangat", "Mayabunder", "Havelock"));
        m.put("Andhra Pradesh", List.of("Amaravati", "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Tirupati", "Rajahmundry", "Kakinada", "Kadapa", "Anantapur", "Eluru", "Ongole", "Srikakulam", "Chittoor"));
        m.put("Arunachal Pradesh", List.of("Itanagar", "Naharlagun", "Tawang", "Ziro", "Pasighat", "Bomdila", "Tezu", "Along", "Roing"));
        m.put("Assam", List.of("Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur", "Bongaigaon", "Karimganj", "North Lakhimpur"));
        m.put("Bihar", List.of("Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia", "Arrah", "Begusarai", "Katihar", "Munger", "Chapra", "Sasaram", "Hajipur", "Bihar Sharif", "Samastipur"));
        m.put("Chandigarh", List.of("Chandigarh"));
        m.put("Chhattisgarh", List.of("Raipur", "Bhilai", "Bilaspur", "Korba", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur", "Mahasamund"));
        m.put("Dadra and Nagar Haveli and Daman and Diu", List.of("Silvassa", "Daman", "Diu", "Amli", "Naroli"));
        m.put("Delhi", List.of("New Delhi", "Delhi", "Dwarka", "Rohini", "Saket", "Lajpat Nagar", "Karol Bagh", "Connaught Place", "Nehru Place", "Janakpuri"));
        m.put("Goa", List.of("Panaji", "Margao", "Vasco da Gama", "Mapusa", "Ponda", "Bicholim", "Curchorem", "Cuncolim", "Sanquelim", "Quepem"));
        m.put("Gujarat", List.of("Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhinagar", "Anand", "Nadiad", "Morbi", "Mehsana", "Bharuch", "Navsari", "Vapi", "Gandhidham", "Porbandar", "Godhra", "Palanpur", "Bhuj"));
        m.put("Haryana", List.of("Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak", "Sonipat", "Yamunanagar", "Panchkula", "Bhiwani", "Sirsa", "Rewari", "Jind", "Kurukshetra"));
        m.put("Himachal Pradesh", List.of("Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Kullu", "Bilaspur", "Hamirpur", "Una", "Palampur", "Nahan", "Chamba", "Dalhousie"));
        m.put("Jammu and Kashmir", List.of("Srinagar", "Jammu", "Anantnag", "Baramulla", "Sopore", "Kathua", "Udhampur", "Kupwara", "Pulwama", "Rajouri", "Poonch"));
        m.put("Jharkhand", List.of("Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Hazaribagh", "Deoghar", "Giridih", "Ramgarh", "Dumka", "Chaibasa"));
        m.put("Karnataka", List.of("Bengaluru", "Mysuru", "Hubballi", "Mangaluru", "Belgaum", "Davangere", "Ballari", "Tumkur", "Shimoga", "Raichur", "Bidar", "Gulbarga", "Hassan", "Udupi", "Dharwad", "Mandya"));
        m.put("Kerala", List.of("Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Kannur", "Kottayam", "Malappuram", "Kasaragod", "Pathanamthitta", "Idukki", "Wayanad"));
        m.put("Ladakh", List.of("Leh", "Kargil", "Diskit", "Padum"));
        m.put("Lakshadweep", List.of("Kavaratti", "Agatti", "Minicoy", "Amini", "Andrott"));
        m.put("Madhya Pradesh", List.of("Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Satna", "Rewa", "Dewas", "Ratlam", "Murwara", "Singrauli", "Burhanpur", "Khandwa", "Chhindwara", "Vidisha"));
        m.put("Maharashtra", List.of("Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Navi Mumbai", "Sangli", "Latur", "Dhule", "Ahmednagar", "Akola", "Chandrapur", "Jalgaon", "Satara", "Ratnagiri", "Parbhani"));
        m.put("Manipur", List.of("Imphal", "Thoubal", "Bishnupur", "Churachandpur", "Ukhrul", "Senapati", "Tamenglong"));
        m.put("Meghalaya", List.of("Shillong", "Tura", "Jowai", "Nongstoin", "Williamnagar", "Baghmara", "Resubelpara"));
        m.put("Mizoram", List.of("Aizawl", "Lunglei", "Champhai", "Serchhip", "Kolasib", "Lawngtlai", "Saiha"));
        m.put("Nagaland", List.of("Kohima", "Dimapur", "Mokokchung", "Tuensang", "Wokha", "Zunheboto", "Mon"));
        m.put("Odisha", List.of("Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri", "Balasore", "Baripada", "Bhadrak", "Jharsuguda", "Jeypore", "Angul", "Koraput"));
        m.put("Puducherry", List.of("Puducherry", "Karaikal", "Mahe", "Yanam"));
        m.put("Punjab", List.of("Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", "Pathankot", "Hoshiarpur", "Batala", "Moga", "Abohar", "Malerkotla", "Khanna", "Phagwara", "Muktsar", "Barnala", "Rajpura", "Firozpur"));
        m.put("Rajasthan", List.of("Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Sikar", "Bharatpur", "Pali", "Sri Ganganagar", "Tonk", "Kishangarh", "Beawar", "Hanumangarh", "Chittorgarh", "Jhunjhunu"));
        m.put("Sikkim", List.of("Gangtok", "Namchi", "Mangan", "Gyalshing", "Rangpo", "Singtam", "Jorethang"));
        m.put("Tamil Nadu", List.of("Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore", "Thoothukudi", "Dindigul", "Thanjavur", "Tiruppur", "Ranipet", "Sivakasi", "Karur", "Nagercoil", "Kanchipuram", "Hosur"));
        m.put("Telangana", List.of("Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam", "Ramagundam", "Mahbubnagar", "Nalgonda", "Adilabad", "Suryapet", "Siddipet", "Miryalaguda", "Mancherial"));
        m.put("Tripura", List.of("Agartala", "Dharmanagar", "Udaipur", "Kailashahar", "Belonia", "Ambassa", "Khowai", "Sabroom"));
        m.put("Uttar Pradesh", List.of("Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj", "Ghaziabad", "Noida", "Bareilly", "Aligarh", "Moradabad", "Gorakhpur", "Saharanpur", "Jhansi", "Muzaffarnagar", "Mathura", "Firozabad", "Ayodhya", "Shahjahanpur", "Rampur"));
        m.put("Uttarakhand", List.of("Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Rudrapur", "Kashipur", "Roorkee", "Nainital", "Mussoorie", "Pithoragarh", "Almora", "Kotdwar"));
        m.put("West Bengal", List.of("Kolkata", "Howrah", "Durgapur", "Asansol", "Siliguri", "Bardhaman", "Malda", "Baharampur", "Haldia", "Kharagpur", "Raiganj", "Krishnanagar", "Nabadwip", "Medinipur", "Darjeeling"));
        STATE_CITIES_MAP = Collections.unmodifiableMap(m);
    }

    /**
     * Get cities for a given state.
     */
    public static List<String> getCitiesByState(String state) {
        if (state == null || state.isBlank()) {
            return List.of();
        }
        return STATE_CITIES_MAP.getOrDefault(state.trim(), List.of());
    }
}
