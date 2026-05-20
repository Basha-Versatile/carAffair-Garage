package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.RcLookupResponse;
import com.garrage.service.RcLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rc-lookup")
@RequiredArgsConstructor
public class RcLookupController {

    private final RcLookupService rcLookupService;

    @PostMapping
    public ResponseEntity<ApiResponse<RcLookupResponse>> lookup(@RequestBody Map<String, String> body) {
        String regNumber = body.get("registrationNumber");
        if (regNumber == null || regNumber.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Registration number is required"));
        }
        RcLookupResponse result = rcLookupService.lookup(regNumber);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }
}
