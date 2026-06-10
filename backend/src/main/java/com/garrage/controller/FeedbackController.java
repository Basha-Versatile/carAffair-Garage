package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ServiceFeedback;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/service-feedbacks")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceFeedback>>> getFeedbacks() {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/service-feedbacks for garage {}", garageId);
        List<ServiceFeedback> feedbacks = feedbackService.getFeedbacks(garageId);
        return ResponseEntity.ok(ApiResponse.ok(feedbacks));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceFeedback>> createFeedback(
            @RequestBody ServiceFeedback feedback) {
        PermissionChecker.require("SERVICE_FEEDBACKS:MANAGE");
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/service-feedbacks for garage {}", garageId);
        ServiceFeedback created = feedbackService.createFeedback(feedback, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }
}
