package com.garrage.service;

import com.garrage.dto.request.CreateBookingRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Booking;
import com.garrage.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ActivityLogService activityLogService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    public Booking createBooking(CreateBookingRequest request) {
        String bookingId = generateBookingId();

        Booking booking = Booking.builder()
                .bookingId(bookingId)
                .service(request.getService())
                .customerName(request.getCustomerName())
                .customerPhone(request.getCustomerPhone())
                .customerEmail(request.getCustomerEmail())
                .address(request.getAddress())
                .vehicleRegNumber(request.getVehicleRegNumber())
                .vehicleBrand(request.getVehicleBrand())
                .vehicleModel(request.getVehicleModel())
                .vehicleFuelType(request.getVehicleFuelType())
                .vehicleYear(request.getVehicleYear())
                .preferredDate(request.getPreferredDate())
                .preferredTime(request.getPreferredTime())
                .concerns(request.getConcerns())
                .pickDrop(request.isPickDrop())
                .status("pending")
                .build();

        return bookingRepository.save(booking);
    }

    public List<Booking> getBookingsByPhone(String phone) {
        return bookingRepository.findByCustomerPhoneOrderByCreatedAtDesc(phone);
    }

    public Booking getBookingById(String bookingId) {
        return bookingRepository.findByBookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
    }

    public List<Booking> getBookingsForGarage(String garageId) {
        return bookingRepository.findByGarageIdOrderByCreatedAtDesc(garageId);
    }

    public Booking updateBookingStatus(String id, String status, String garageId) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        booking.setStatus(status);
        if (booking.getGarageId() == null) {
            booking.setGarageId(garageId);
        }
        Booking saved = bookingRepository.save(booking);
        activityLogService.log("UPDATE", "BOOKING", saved.getId(),
                "updated booking " + saved.getBookingId() + " status to '" + status + "'");
        return saved;
    }

    private String generateBookingId() {
        StringBuilder sb = new StringBuilder("CA-");
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return sb.toString();
    }
}
