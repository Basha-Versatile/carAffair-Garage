package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.ServiceReminder;
import com.garrage.security.TenantContext;
import com.garrage.service.ReminderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/service-reminders")
@RequiredArgsConstructor
public class ReminderController {

    private final ReminderService reminderService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceReminder>>> getReminders(
            @RequestParam(required = false) String status) {
        String garageId = TenantContext.getGarageId();
        log.info("GET /api/service-reminders (status={}) for garage {}", status, garageId);

        List<ServiceReminder> reminders;
        if (status != null && !status.isBlank()) {
            reminders = reminderService.getRemindersByStatus(garageId, status);
        } else {
            reminders = reminderService.getReminders(garageId);
        }
        return ResponseEntity.ok(ApiResponse.ok(reminders));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceReminder>> createReminder(
            @RequestBody ServiceReminder reminder) {
        String garageId = TenantContext.getGarageId();
        log.info("POST /api/service-reminders for garage {}", garageId);
        ServiceReminder created = reminderService.createReminder(reminder, garageId);
        return ResponseEntity.ok(ApiResponse.ok(created));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceReminder>> updateReminder(
            @PathVariable String id,
            @RequestBody ServiceReminder reminder) {
        String garageId = TenantContext.getGarageId();
        log.info("PUT /api/service-reminders/{} for garage {}", id, garageId);
        ServiceReminder updated = reminderService.updateReminder(id, reminder, garageId);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }
}
