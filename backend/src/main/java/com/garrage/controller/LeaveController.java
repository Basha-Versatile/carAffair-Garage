package com.garrage.controller;

import com.garrage.dto.response.ApiResponse;
import com.garrage.model.LeaveBalance;
import com.garrage.model.LeaveRequest;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.LeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.Year;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class LeaveController {

    private final LeaveService leaveService;

    private UserPrincipal getCurrentUser() {
        return (UserPrincipal) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    // ─── Apply for leave ───

    @PostMapping("/api/leaves")
    public ResponseEntity<ApiResponse<LeaveRequest>> applyLeave(@RequestBody Map<String, String> body) {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        LeaveRequest request = leaveService.applyLeave(garageId, user.getId(),
                body.get("leaveType"), body.get("startDate"), body.get("endDate"),
                body.get("reason"));
        return ResponseEntity.ok(ApiResponse.ok(request));
    }

    // ─── List leaves (admin sees all, staff sees own) ───

    @GetMapping("/api/leaves")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getLeaves(
            @RequestParam(required = false) String status) {
        String garageId = TenantContext.getGarageId();
        List<LeaveRequest> requests = leaveService.getLeaveRequests(garageId, status);
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    @GetMapping("/api/leaves/my")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getMyLeaves() {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        List<LeaveRequest> requests = leaveService.getMyLeaves(garageId, user.getId());
        return ResponseEntity.ok(ApiResponse.ok(requests));
    }

    // ─── Approve / Reject ───

    @PutMapping("/api/leaves/{id}/approve")
    public ResponseEntity<ApiResponse<LeaveRequest>> approveLeave(@PathVariable String id) {
        PermissionChecker.require("LEAVES:MANAGE");
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        // Resolve reviewer name
        String reviewerName = user.getPhone(); // fallback
        LeaveRequest request = leaveService.approveLeave(garageId, id, user.getId(), reviewerName);
        return ResponseEntity.ok(ApiResponse.ok(request));
    }

    @PutMapping("/api/leaves/{id}/reject")
    public ResponseEntity<ApiResponse<LeaveRequest>> rejectLeave(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        PermissionChecker.require("LEAVES:MANAGE");
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        LeaveRequest request = leaveService.rejectLeave(garageId, id,
                user.getId(), user.getPhone(), body.get("note"));
        return ResponseEntity.ok(ApiResponse.ok(request));
    }

    // ─── Balance ───

    @GetMapping("/api/leaves/balance/my")
    public ResponseEntity<ApiResponse<LeaveBalance>> getMyBalance() {
        String garageId = TenantContext.getGarageId();
        UserPrincipal user = getCurrentUser();
        LeaveBalance balance = leaveService.getBalance(garageId, user.getId(), Year.now().toString());
        return ResponseEntity.ok(ApiResponse.ok(balance));
    }

    @GetMapping("/api/leaves/balance/{staffId}")
    public ResponseEntity<ApiResponse<LeaveBalance>> getStaffBalance(@PathVariable String staffId) {
        String garageId = TenantContext.getGarageId();
        LeaveBalance balance = leaveService.getBalance(garageId, staffId, Year.now().toString());
        return ResponseEntity.ok(ApiResponse.ok(balance));
    }

    @PutMapping("/api/leaves/balance/{staffId}")
    public ResponseEntity<ApiResponse<LeaveBalance>> updateBalance(
            @PathVariable String staffId,
            @RequestBody Map<String, Integer> body) {
        PermissionChecker.require("LEAVES:MANAGE");
        String garageId = TenantContext.getGarageId();
        LeaveBalance balance = leaveService.updateBalance(garageId, staffId,
                body.getOrDefault("casualTotal", 12),
                body.getOrDefault("sickTotal", 6),
                body.getOrDefault("earnedTotal", 15));
        return ResponseEntity.ok(ApiResponse.ok(balance));
    }

    // ─── Calendar ───

    @GetMapping("/api/leaves/calendar")
    public ResponseEntity<ApiResponse<List<LeaveRequest>>> getCalendar(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        String garageId = TenantContext.getGarageId();
        List<LeaveRequest> leaves = leaveService.getLeaveCalendar(garageId, startDate, endDate);
        return ResponseEntity.ok(ApiResponse.ok(leaves));
    }
}
