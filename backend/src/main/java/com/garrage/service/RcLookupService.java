package com.garrage.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.garrage.config.SurePassProperties;
import com.garrage.dto.response.RcLookupResponse;
import com.garrage.exception.BadRequestException;
import com.garrage.model.Brand;
import com.garrage.model.VehicleModel;
import com.garrage.repository.BrandRepository;
import com.garrage.repository.VehicleModelRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class RcLookupService {

    private final SurePassProperties surePassProperties;
    private final RestTemplate restTemplate;
    private final BrandRepository brandRepository;
    private final VehicleModelRepository vehicleModelRepository;

    public RcLookupResponse lookup(String registrationNumber) {
        String token = surePassProperties.getToken();
        if (token == null || token.isBlank()) {
            throw new BadRequestException("RC lookup is not configured. Please contact the administrator.");
        }

        // 1. Call SurePass API
        String url = surePassProperties.getBaseUrl() + "/api/v1/rc/rc-full";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(token);

        String cleanReg = registrationNumber.toUpperCase().replaceAll("\\s+", "");
        Map<String, String> body = Map.of("id_number", cleanReg);
        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        ResponseEntity<JsonNode> response;
        try {
            response = restTemplate.exchange(url, HttpMethod.POST, request, JsonNode.class);
        } catch (Exception e) {
            log.error("SurePass API call failed: {}", e.getMessage());
            throw new BadRequestException("RC lookup failed. Please try again later.");
        }

        JsonNode root = response.getBody();
        if (root == null || !root.has("data")) {
            throw new BadRequestException("RC lookup returned no data for this registration number.");
        }

        JsonNode data = root.get("data");

        // 2. Extract fields
        String makerDescription = textOrNull(data, "maker_description");
        String makerModel = textOrNull(data, "maker_model");
        String fuelTypeRaw = textOrNull(data, "fuel_type");

        // 3. Brand matching — longest substring match wins
        Brand matchedBrand = matchBrand(makerDescription);

        // 4. Model matching — only if brand matched
        VehicleModel matchedModel = null;
        if (matchedBrand != null) {
            matchedModel = matchModel(matchedBrand.getId(), makerModel, fuelTypeRaw);
        }

        // 5. Normalize fuel type
        String normalizedFuel = normalizeFuelType(fuelTypeRaw);

        // 6. Build response
        return RcLookupResponse.builder()
                .ownerName(textOrNull(data, "owner_name"))
                .address(textOrNull(data, "present_address"))
                .mobileNumber(textOrNull(data, "mobile_number"))
                .makerDescription(makerDescription)
                .makerModel(makerModel)
                .fuelType(fuelTypeRaw)
                .engineNumber(textOrNull(data, "vehicle_engine_number"))
                .chassisNumber(textOrNull(data, "vehicle_chasi_number"))
                .manufacturingDate(textOrNull(data, "manufacturing_date_formatted"))
                .registrationDate(textOrNull(data, "registration_date"))
                .color(textOrNull(data, "color"))
                .bodyType(textOrNull(data, "body_type"))
                .vehicleCategory(textOrNull(data, "vehicle_category"))
                .rcStatus(textOrNull(data, "rc_status"))
                .insuranceCompany(textOrNull(data, "insurance_company"))
                .policyNumber(textOrNull(data, "insurance_policy_number"))
                .insuranceUpto(textOrNull(data, "insurance_upto"))
                .financer(textOrNull(data, "financer"))
                .matchedBrandId(matchedBrand != null ? matchedBrand.getId() : null)
                .matchedBrandName(matchedBrand != null ? matchedBrand.getName() : null)
                .matchedModelId(matchedModel != null ? matchedModel.getId() : null)
                .matchedModelName(matchedModel != null ? matchedModel.getName() : null)
                .matchedFuelType(normalizedFuel)
                .build();
    }

    private Brand matchBrand(String makerDescription) {
        if (makerDescription == null || makerDescription.isBlank()) return null;
        String descUpper = makerDescription.toUpperCase();

        List<Brand> allBrands = brandRepository.findAll();
        Brand best = null;
        int bestLen = 0;

        for (Brand brand : allBrands) {
            String brandUpper = brand.getName().toUpperCase();
            if (descUpper.contains(brandUpper) && brandUpper.length() > bestLen) {
                best = brand;
                bestLen = brandUpper.length();
            }
        }
        return best;
    }

    private VehicleModel matchModel(String brandId, String makerModel, String fuelTypeRaw) {
        if (makerModel == null || makerModel.isBlank()) return null;
        String modelUpper = makerModel.toUpperCase();

        List<VehicleModel> models = vehicleModelRepository.findByBrandId(brandId);
        VehicleModel best = null;
        int bestLen = 0;

        for (VehicleModel m : models) {
            String nameUpper = m.getName().toUpperCase();
            if (modelUpper.contains(nameUpper) && nameUpper.length() > bestLen) {
                best = m;
                bestLen = nameUpper.length();
            }
        }

        // If we found a match, try to narrow by fuel type when multiple models share the name
        if (best != null && fuelTypeRaw != null) {
            String normalizedFuel = normalizeFuelType(fuelTypeRaw);
            if (normalizedFuel != null) {
                final String bestName = best.getName();
                VehicleModel fuelMatch = models.stream()
                        .filter(m -> m.getName().equalsIgnoreCase(bestName))
                        .filter(m -> normalizedFuel.equalsIgnoreCase(m.getFuelType()))
                        .findFirst()
                        .orElse(null);
                if (fuelMatch != null) return fuelMatch;
            }
        }

        return best;
    }

    private String normalizeFuelType(String raw) {
        if (raw == null) return null;
        return switch (raw.toUpperCase().trim()) {
            case "PETROL" -> "Petrol";
            case "DIESEL" -> "Diesel";
            case "CNG" -> "CNG";
            case "LPG" -> "LPG";
            case "ELECTRIC" -> "ELECTRIC";
            case "HYBRID", "PETROL/HYBRID", "DIESEL/HYBRID" -> "HYBRID";
            default -> null;
        };
    }

    private String textOrNull(JsonNode node, String field) {
        JsonNode child = node.get(field);
        if (child == null || child.isNull() || child.asText().isBlank()) return null;
        return child.asText().trim();
    }
}
