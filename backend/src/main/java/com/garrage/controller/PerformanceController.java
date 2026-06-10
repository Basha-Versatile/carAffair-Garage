package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Attendance;
import com.garrage.model.LeaveRequest;
import com.garrage.model.User;
import com.garrage.repository.AttendanceRepository;
import com.garrage.repository.LeaveRequestRepository;
import com.garrage.repository.UserRepository;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class PerformanceController {

    private final OrderService orderService;
    private final AttendanceRepository attendanceRepository;
    private final LeaveRequestRepository leaveRequestRepository;
    private final UserRepository userRepository;

    @GetMapping("/api/performance/staff")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getStaffPerformance(
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {

        PermissionChecker.require("STAFF_PERFORMANCE:VIEW");
        String garageId = TenantContext.getGarageId();

        // Default to current month
        if (startDate == null || endDate == null) {
            LocalDate now = LocalDate.now();
            startDate = now.withDayOfMonth(1).toString();
            endDate = now.toString();
        }

        // Get all staff
        List<User> staffList = userRepository.findByGarageIdAndRole(garageId, "garage_staff");

        // Get task analytics from orders
        Map<String, Object> taskAnalytics = orderService.getTaskAnalytics(garageId);
        @SuppressWarnings("unchecked")
        Map<String, Number> staffTaskCount = (Map<String, Number>) taskAnalytics.getOrDefault("staffTaskCount", Map.of());
        @SuppressWarnings("unchecked")
        Map<String, Number> staffAvgTimeMs = (Map<String, Number>) taskAnalytics.getOrDefault("staffAvgTimeMs", Map.of());

        // Get attendance records in range
        List<Attendance> attendanceRecords = attendanceRepository.findByGarageIdAndDateRange(
                garageId, startDate, endDate);

        // Group attendance by staffId
        Map<String, List<Attendance>> attendanceByStaff = attendanceRecords.stream()
                .collect(Collectors.groupingBy(Attendance::getStaffId));

        // Calculate business days in range
        long totalBusinessDays = countBusinessDays(startDate, endDate);

        // Build per-staff performance
        List<Map<String, Object>> result = new ArrayList<>();

        for (User staff : staffList) {
            if (!staff.isActive()) continue;

            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("staffId", staff.getId());
            entry.put("staffName", staff.getName());
            entry.put("role", staff.getStaffTitle() != null ? staff.getStaffTitle() : "Staff");

            // Task metrics
            String name = staff.getName();
            entry.put("tasksCompleted", staffTaskCount.getOrDefault(name, 0).intValue());
            entry.put("avgTaskTimeMs", staffAvgTimeMs.getOrDefault(name, 0).longValue());

            // Attendance metrics
            List<Attendance> staffAttendance = attendanceByStaff.getOrDefault(staff.getId(), List.of());
            int daysPresent = staffAttendance.size();
            long totalWorkMinutes = staffAttendance.stream()
                    .mapToLong(Attendance::getTotalWorkMinutes)
                    .sum();
            double avgWorkMinutes = daysPresent > 0 ? (double) totalWorkMinutes / daysPresent : 0;
            double attendanceRate = totalBusinessDays > 0 ? (double) daysPresent / totalBusinessDays * 100 : 0;

            entry.put("daysPresent", daysPresent);
            entry.put("totalWorkMinutes", totalWorkMinutes);
            entry.put("avgWorkMinutes", Math.round(avgWorkMinutes));
            entry.put("attendanceRate", Math.round(attendanceRate));

            // Leave metrics
            long leaveDays = leaveRequestRepository.countByGarageIdAndStaffIdAndStatusAndStartDateBetween(
                    garageId, staff.getId(), "approved", startDate, endDate);
            entry.put("leaveDaysTaken", leaveDays);

            result.add(entry);
        }

        // Sort by tasks completed descending
        result.sort((a, b) -> Integer.compare(
                (int) b.getOrDefault("tasksCompleted", 0),
                (int) a.getOrDefault("tasksCompleted", 0)));

        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    private long countBusinessDays(String startStr, String endStr) {
        LocalDate start = LocalDate.parse(startStr);
        LocalDate end = LocalDate.parse(endStr);
        long count = 0;
        for (LocalDate d = start; !d.isAfter(end); d = d.plusDays(1)) {
            int dow = d.getDayOfWeek().getValue();
            if (dow < 6) count++; // Mon-Fri
        }
        return count;
    }
}
