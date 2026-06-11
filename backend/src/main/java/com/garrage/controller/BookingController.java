package com.garrage.controller;

import com.garrage.dto.request.CreateBookingRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.RcLookupResponse;
import com.garrage.model.Booking;
import com.garrage.model.ServiceCategory;
import com.garrage.model.ServiceEntry;
import com.garrage.security.PermissionChecker;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.BookingService;
import com.garrage.service.RcLookupService;
import com.garrage.service.ServiceCategoryService;
import com.garrage.service.ServiceEntryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;
    private final RcLookupService rcLookupService;
    private final ServiceEntryService serviceEntryService;
    private final ServiceCategoryService serviceCategoryService;

    @PostMapping("/api/bookings")
    public ResponseEntity<ApiResponse<Booking>> createBooking(@Valid @RequestBody CreateBookingRequest request) {
        Booking booking = bookingService.createBooking(request);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @GetMapping("/api/bookings")
    public ResponseEntity<ApiResponse<List<Booking>>> getMyBookings(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<Booking> bookings = bookingService.getBookingsByPhone(principal.getPhone());
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    @GetMapping("/api/bookings/{bookingId}")
    public ResponseEntity<ApiResponse<Booking>> getBookingById(@PathVariable String bookingId) {
        Booking booking = bookingService.getBookingById(bookingId);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    @GetMapping("/api/admin/bookings")
    public ResponseEntity<ApiResponse<List<Booking>>> getBookingsForGarage() {
        PermissionChecker.require("APPOINTMENTS:VIEW");
        List<Booking> bookings = bookingService.getBookingsForGarage(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    @PutMapping("/api/admin/bookings/{id}")
    public ResponseEntity<ApiResponse<Booking>> updateBookingStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        PermissionChecker.require("APPOINTMENTS:MANAGE");
        String status = body.get("status");
        String adminNotes = body.get("adminNotes");
        String suggestedDate = body.get("suggestedDate");
        String suggestedTime = body.get("suggestedTime");
        Booking booking = bookingService.updateBookingStatus(
                id, status, TenantContext.getGarageId(),
                adminNotes, suggestedDate, suggestedTime);
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }

    // ─── Public endpoints for customer booking flow ───

    @PostMapping("/api/public/rc-lookup")
    public ResponseEntity<ApiResponse<RcLookupResponse>> publicRcLookup(
            @RequestBody Map<String, String> body) {
        String regNumber = body.get("registrationNumber");
        if (regNumber == null || regNumber.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Registration number is required"));
        }
        RcLookupResponse result = rcLookupService.lookup(regNumber);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/api/public/garage/{garageId}/services")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getPublicGarageServices(
            @PathVariable String garageId) {
        List<ServiceCategory> categories = serviceCategoryService.getCategories(garageId);
        List<ServiceEntry> services = serviceEntryService.getServices(garageId);

        List<Map<String, Object>> grouped = categories.stream().map(cat -> {
            List<Map<String, String>> catServices = services.stream()
                    .filter(s -> cat.getId().equals(s.getCategoryId()))
                    .map(s -> Map.of("id", s.getId(), "name", s.getName()))
                    .collect(Collectors.toList());
            Map<String, Object> group = new LinkedHashMap<>();
            group.put("categoryId", cat.getId());
            group.put("categoryName", cat.getName());
            group.put("services", catServices);
            return group;
        }).filter(m -> !((List<?>) m.get("services")).isEmpty())
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.ok(grouped));
    }
}
