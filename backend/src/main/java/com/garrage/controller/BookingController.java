package com.garrage.controller;

import com.garrage.dto.request.CreateBookingRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Booking;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

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
        List<Booking> bookings = bookingService.getBookingsForGarage(TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(bookings));
    }

    @PutMapping("/api/admin/bookings/{id}")
    public ResponseEntity<ApiResponse<Booking>> updateBookingStatus(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String status = body.get("status");
        Booking booking = bookingService.updateBookingStatus(id, status, TenantContext.getGarageId());
        return ResponseEntity.ok(ApiResponse.ok(booking));
    }
}
