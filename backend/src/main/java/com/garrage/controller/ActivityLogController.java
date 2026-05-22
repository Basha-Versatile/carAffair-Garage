package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ActivityLog;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@RestController
@RequestMapping("/api/activity-logs")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<ActivityLog>>> getLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String entityType,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {

        PermissionChecker.require("LOGS:VIEW");
        String garageId = TenantContext.getGarageId();

        LocalDateTime from = dateFrom != null && !dateFrom.isBlank()
                ? LocalDate.parse(dateFrom).atStartOfDay() : null;
        LocalDateTime to = dateTo != null && !dateTo.isBlank()
                ? LocalDate.parse(dateTo).atTime(LocalTime.MAX) : null;

        Page<ActivityLog> logs = activityLogService.getLogs(
                garageId, action, entityType, userId, from, to, page, size);

        return ResponseEntity.ok(ApiResponse.ok(logs));
    }
}
