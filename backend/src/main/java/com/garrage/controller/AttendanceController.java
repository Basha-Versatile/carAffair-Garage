package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Attendance;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class AttendanceController {

    private final AttendanceService attendanceService;

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/api/attendance/checkin")
    public ResponseEntity<ApiResponse<Attendance>> checkin(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(value = "inUniform", defaultValue = "true") boolean inUniform,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        Attendance attendance = attendanceService.checkin(garageId, user.getId(), null,
                lat, lng, photo, inUniform);
        return ResponseEntity.ok(ApiResponse.ok(attendance));
    }

    @PostMapping("/api/attendance/checkout")
    public ResponseEntity<ApiResponse<Attendance>> checkout(
            @RequestParam("lat") double lat,
            @RequestParam("lng") double lng,
            @RequestParam(value = "photo", required = false) MultipartFile photo) {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        Attendance attendance = attendanceService.checkout(garageId, user.getId(), lat, lng, photo);
        return ResponseEntity.ok(ApiResponse.ok(attendance));
    }

    @GetMapping("/api/attendance/my-status")
    public ResponseEntity<ApiResponse<Attendance>> getMyStatus() {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        Attendance attendance = attendanceService.getMyStatus(garageId, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(attendance));
    }

    @GetMapping("/api/attendance/today")
    public ResponseEntity<ApiResponse<List<Attendance>>> getTodayAttendance() {
        String garageId = TenantContext.getGarageId();
        List<Attendance> records = attendanceService.getTodayAttendance(garageId);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/api/attendance/staff/{staffId}")
    public ResponseEntity<ApiResponse<List<Attendance>>> getStaffAttendance(
            @PathVariable String staffId,
            @RequestParam String startDate,
            @RequestParam String endDate) {
        String garageId = TenantContext.getGarageId();
        List<Attendance> records = attendanceService.getStaffAttendance(garageId, staffId,
                startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(records));
    }

    @GetMapping("/api/attendance/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSummary(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        String garageId = TenantContext.getGarageId();
        Map<String, Object> summary = attendanceService.getSummary(garageId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/api/attendance/absentees")
    public ResponseEntity<ApiResponse<List<Map<String, String>>>> getAbsentees(
            @RequestParam(required = false) String date) {
        String garageId = TenantContext.getGarageId();
        if (date == null || date.isBlank()) {
            date = java.time.LocalDate.now().toString();
        }
        List<Map<String, String>> absentees = attendanceService.getAbsentees(garageId, date);
        return ResponseEntity.ok(ApiResponse.ok(absentees));
    }
}
