package com.garrage.service;

import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.LeaveBalance;
import com.garrage.model.LeaveRequest;
import com.garrage.model.User;
import com.garrage.repository.LeaveBalanceRepository;
import com.garrage.repository.LeaveRequestRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.Year;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class LeaveService {

    private final LeaveRequestRepository leaveRequestRepository;
    private final LeaveBalanceRepository leaveBalanceRepository;
    private final UserRepository userRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    // ─── Apply for leave ───

    public LeaveRequest applyLeave(String garageId, String staffId,
                                     String leaveType, String startDate, String endDate,
                                     String reason) {
        // Resolve staff name
        String staffName = userRepository.findById(staffId)
                .map(User::getName)
                .orElse("Staff");

        // Calculate days
        int days = (int) ChronoUnit.DAYS.between(
                LocalDate.parse(startDate), LocalDate.parse(endDate)) + 1;

        // Validate balance if not unpaid
        if (!"unpaid".equals(leaveType)) {
            LeaveBalance balance = getOrCreateBalance(garageId, staffId, Year.now().toString());
            int remaining = getRemaining(balance, leaveType);
            if (days > remaining) {
                throw new IllegalStateException("Insufficient " + leaveType + " leave balance. Remaining: " + remaining);
            }
        }

        LeaveRequest request = LeaveRequest.builder()
                .garageId(garageId)
                .staffId(staffId)
                .staffName(staffName)
                .leaveType(leaveType)
                .startDate(startDate)
                .endDate(endDate)
                .days(days)
                .reason(reason)
                .status("pending")
                .build();

        LeaveRequest saved = leaveRequestRepository.save(request);
        activityLogService.log("CREATE", "LEAVE", saved.getId(),
                staffName + " applied for " + days + " day(s) " + leaveType + " leave");

        // Notify admin
        notificationService.notifyAdmin(garageId,
                "LEAVE_APPLIED", "STAFF", "normal",
                "Leave Request",
                staffName + " applied for " + days + " day(s) " + leaveType + " leave (" + startDate + " to " + endDate + ")",
                "/dashboard/leaves",
                "LEAVE", saved.getId());

        return saved;
    }

    // ─── Approve ───

    public LeaveRequest approveLeave(String garageId, String leaveId,
                                       String reviewerId, String reviewerName) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (!"pending".equals(request.getStatus())) {
            throw new IllegalStateException("Leave request is already " + request.getStatus());
        }

        request.setStatus("approved");
        request.setReviewedBy(reviewerId);
        request.setReviewerName(reviewerName);
        request.setReviewedAt(LocalDateTime.now());

        // Deduct balance if not unpaid
        if (!"unpaid".equals(request.getLeaveType())) {
            LeaveBalance balance = getOrCreateBalance(garageId, request.getStaffId(),
                    Year.now().toString());
            deductBalance(balance, request.getLeaveType(), request.getDays());
            leaveBalanceRepository.save(balance);
        }

        LeaveRequest saved = leaveRequestRepository.save(request);
        activityLogService.log("UPDATE", "LEAVE", saved.getId(),
                "approved leave for " + saved.getStaffName());

        // Notify staff
        notificationService.notify(garageId, request.getStaffId(),
                "LEAVE_APPROVED", "STAFF", "normal",
                "Leave Approved",
                "Your " + request.getLeaveType() + " leave (" + request.getStartDate() + " to " + request.getEndDate() + ") has been approved",
                "/dashboard/leaves",
                "LEAVE", saved.getId());

        return saved;
    }

    // ─── Reject ───

    public LeaveRequest rejectLeave(String garageId, String leaveId,
                                      String reviewerId, String reviewerName, String note) {
        LeaveRequest request = leaveRequestRepository.findById(leaveId)
                .orElseThrow(() -> new ResourceNotFoundException("Leave request not found"));

        if (!"pending".equals(request.getStatus())) {
            throw new IllegalStateException("Leave request is already " + request.getStatus());
        }

        request.setStatus("rejected");
        request.setReviewedBy(reviewerId);
        request.setReviewerName(reviewerName);
        request.setRejectionNote(note);
        request.setReviewedAt(LocalDateTime.now());

        LeaveRequest saved = leaveRequestRepository.save(request);
        activityLogService.log("UPDATE", "LEAVE", saved.getId(),
                "rejected leave for " + saved.getStaffName());

        // Notify staff
        notificationService.notify(garageId, request.getStaffId(),
                "LEAVE_REJECTED", "STAFF", "normal",
                "Leave Rejected",
                "Your " + request.getLeaveType() + " leave request was rejected" + (note != null ? ": " + note : ""),
                "/dashboard/leaves",
                "LEAVE", saved.getId());

        return saved;
    }

    // ─── Query ───

    public List<LeaveRequest> getLeaveRequests(String garageId, String status) {
        if (status != null && !status.isBlank()) {
            return leaveRequestRepository.findByGarageIdAndStatusOrderByCreatedAtDesc(garageId, status);
        }
        return leaveRequestRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public List<LeaveRequest> getMyLeaves(String garageId, String staffId) {
        return leaveRequestRepository.findByGarageIdAndStaffIdOrderByCreatedAtDesc(garageId, staffId);
    }

    public LeaveBalance getBalance(String garageId, String staffId, String year) {
        return getOrCreateBalance(garageId, staffId, year);
    }

    public LeaveBalance updateBalance(String garageId, String staffId,
                                        int casualTotal, int sickTotal, int earnedTotal) {
        LeaveBalance balance = getOrCreateBalance(garageId, staffId, Year.now().toString());
        balance.setCasualTotal(casualTotal);
        balance.setSickTotal(sickTotal);
        balance.setEarnedTotal(earnedTotal);
        return leaveBalanceRepository.save(balance);
    }

    public List<LeaveRequest> getLeaveCalendar(String garageId, String startDate, String endDate) {
        return leaveRequestRepository.findByGarageIdAndStartDateBetween(garageId, startDate, endDate);
    }

    // ─── Helpers ───

    private LeaveBalance getOrCreateBalance(String garageId, String staffId, String year) {
        return leaveBalanceRepository.findByGarageIdAndStaffIdAndYear(garageId, staffId, year)
                .orElseGet(() -> {
                    LeaveBalance balance = LeaveBalance.builder()
                            .garageId(garageId)
                            .staffId(staffId)
                            .year(year)
                            .build();
                    return leaveBalanceRepository.save(balance);
                });
    }

    private int getRemaining(LeaveBalance balance, String type) {
        return switch (type) {
            case "casual" -> balance.getCasualTotal() - balance.getCasualUsed();
            case "sick" -> balance.getSickTotal() - balance.getSickUsed();
            case "earned" -> balance.getEarnedTotal() - balance.getEarnedUsed();
            default -> 0;
        };
    }

    private void deductBalance(LeaveBalance balance, String type, int days) {
        switch (type) {
            case "casual" -> balance.setCasualUsed(balance.getCasualUsed() + days);
            case "sick" -> balance.setSickUsed(balance.getSickUsed() + days);
            case "earned" -> balance.setEarnedUsed(balance.getEarnedUsed() + days);
        }
    }
}
