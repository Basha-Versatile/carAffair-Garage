package com.garrage.service;

import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Attendance;
import com.garrage.model.User;
import com.garrage.repository.AttendanceRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AttendanceService {

    private final AttendanceRepository attendanceRepository;
    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;

    // ─── Check-in ───

    public Attendance checkin(String garageId, String staffId, String staffName,
                               double lat, double lng, MultipartFile photo,
                               boolean inUniform) {
        String today = LocalDate.now().toString();

        // Resolve staff name if not provided
        if (staffName == null || staffName.isBlank()) {
            staffName = userRepository.findById(staffId)
                    .map(com.garrage.model.User::getName)
                    .orElse("Staff");
        }

        // Validate no duplicate check-in
        Optional<Attendance> existing = attendanceRepository.findByGarageIdAndStaffIdAndDate(garageId, staffId, today);
        if (existing.isPresent()) {
            throw new IllegalStateException("Already checked in today");
        }

        String photoId = null;
        if (photo != null && !photo.isEmpty()) {
            try {
                photoId = imageStorageService.storeImage(photo, garageId, "attendance-" + staffId);
            } catch (Exception e) {
                log.warn("Failed to store check-in photo: {}", e.getMessage());
            }
        }

        Attendance attendance = Attendance.builder()
                .garageId(garageId)
                .staffId(staffId)
                .staffName(staffName)
                .date(today)
                .checkinTime(LocalDateTime.now())
                .checkinLat(lat)
                .checkinLng(lng)
                .checkinPhotoId(photoId)
                .inUniform(inUniform)
                .status("checked_in")
                .build();

        Attendance saved = attendanceRepository.save(attendance);
        activityLogService.log("CREATE", "ATTENDANCE", saved.getId(),
                staffName + " checked in");

        // Notify admin
        notificationService.notifyAdmin(garageId,
                "STAFF_CHECKIN", "STAFF", "normal",
                "Staff Check-in",
                staffName + " has checked in" + (inUniform ? "" : " (not in uniform)"),
                "/dashboard/attendance",
                "ATTENDANCE", saved.getId());

        return saved;
    }

    // ─── Check-out ───

    public Attendance checkout(String garageId, String staffId,
                                double lat, double lng, MultipartFile photo) {
        String today = LocalDate.now().toString();

        Attendance attendance = attendanceRepository.findByGarageIdAndStaffIdAndDate(garageId, staffId, today)
                .orElseThrow(() -> new ResourceNotFoundException("No check-in record found for today"));

        if (attendance.getCheckoutTime() != null) {
            throw new IllegalStateException("Already checked out today");
        }

        String photoId = null;
        if (photo != null && !photo.isEmpty()) {
            try {
                photoId = imageStorageService.storeImage(photo, garageId, "attendance-" + staffId);
            } catch (Exception e) {
                log.warn("Failed to store check-out photo: {}", e.getMessage());
            }
        }

        attendance.setCheckoutTime(LocalDateTime.now());
        attendance.setCheckoutLat(lat);
        attendance.setCheckoutLng(lng);
        attendance.setCheckoutPhotoId(photoId);
        attendance.setStatus("checked_out");

        // Calculate total work minutes
        long minutes = Duration.between(attendance.getCheckinTime(), attendance.getCheckoutTime()).toMinutes();
        attendance.setTotalWorkMinutes(Math.max(0, minutes));

        Attendance saved = attendanceRepository.save(attendance);
        activityLogService.log("UPDATE", "ATTENDANCE", saved.getId(),
                saved.getStaffName() + " checked out (" + saved.getTotalWorkMinutes() + " min)");

        return saved;
    }

    // ─── Query methods ───

    public Attendance getMyStatus(String garageId, String staffId) {
        String today = LocalDate.now().toString();
        return attendanceRepository.findByGarageIdAndStaffIdAndDate(garageId, staffId, today)
                .orElse(null);
    }

    public List<Attendance> getTodayAttendance(String garageId) {
        String today = LocalDate.now().toString();
        return attendanceRepository.findByGarageIdAndDate(garageId, today);
    }

    public List<Attendance> getStaffAttendance(String garageId, String staffId,
                                                 String startDate, String endDate) {
        return attendanceRepository.findByGarageIdAndStaffIdAndDateRange(
                garageId, staffId, startDate, endDate);
    }

    public List<Attendance> getAttendanceRange(String garageId, String startDate, String endDate) {
        return attendanceRepository.findByGarageIdAndDateRange(
                garageId, startDate, endDate);
    }

    /**
     * Get absentees: staff who haven't checked in on the given date.
     */
    public List<Map<String, String>> getAbsentees(String garageId, String date) {
        List<User> allStaff = userRepository.findByGarageIdAndRole(garageId, "garage_staff");
        List<Attendance> records = attendanceRepository.findByGarageIdAndDate(garageId, date);
        Set<String> checkedIn = new HashSet<>();
        for (Attendance a : records) {
            checkedIn.add(a.getStaffId());
        }

        List<Map<String, String>> absentees = new ArrayList<>();
        for (User staff : allStaff) {
            if (!checkedIn.contains(staff.getId())) {
                Map<String, String> entry = new LinkedHashMap<>();
                entry.put("id", staff.getId());
                entry.put("name", staff.getName());
                absentees.add(entry);
            }
        }
        return absentees;
    }

    /**
     * Summary stats for a date range.
     */
    public Map<String, Object> getSummary(String garageId, String startDate, String endDate) {
        List<Attendance> records = attendanceRepository.findByGarageIdAndDateRange(
                garageId, startDate, endDate);

        long totalCheckins = records.size();
        long totalCheckouts = records.stream().filter(a -> a.getCheckoutTime() != null).count();
        long totalMinutes = records.stream().mapToLong(Attendance::getTotalWorkMinutes).sum();
        double avgMinutes = totalCheckouts > 0 ? (double) totalMinutes / totalCheckouts : 0;

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalCheckins", totalCheckins);
        summary.put("totalCheckouts", totalCheckouts);
        summary.put("totalWorkMinutes", totalMinutes);
        summary.put("avgWorkMinutes", Math.round(avgMinutes));
        return summary;
    }
}
