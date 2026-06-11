package com.garrage.service;

import com.garrage.dto.request.CreateBookingRequest;
import com.garrage.exception.ResourceNotFoundException;
import com.garrage.model.Booking;
import com.garrage.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final ActivityLogService activityLogService;
    private final NotificationService notificationService;
    private final EmailService emailService;

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final String DEFAULT_GARAGE_ID = "6a29730fe41e1f13f7f90ed1";

    public Booking createBooking(CreateBookingRequest request) {
        String bookingId = generateBookingId();

        Booking booking = Booking.builder()
                .bookingId(bookingId)
                .garageId(DEFAULT_GARAGE_ID)
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
                .customerMessage(request.getCustomerMessage())
                .pickDrop(request.isPickDrop())
                .status("pending")
                .build();

        Booking saved = bookingRepository.save(booking);

        // Notify garage about new booking
        notificationService.notifyGarage(DEFAULT_GARAGE_ID,
                "BOOKING_NEW", "APPOINTMENTS", "normal",
                "New Booking Request",
                saved.getCustomerName() + " - " + saved.getService() + " (" + saved.getPreferredDate() + ")",
                "/dashboard/appointments",
                "BOOKING", saved.getId());

        // Send confirmation email to customer
        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().isBlank()) {
            emailService.sendBookingReceivedEmail(
                    saved.getCustomerEmail(), saved.getCustomerName(),
                    saved.getBookingId(), saved.getService(),
                    saved.getPreferredDate(), saved.getPreferredTime());
        }

        return saved;
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

    public Booking updateBookingStatus(String id, String status, String garageId,
                                        String adminNotes, String suggestedDate, String suggestedTime) {
        Booking booking = bookingRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + id));
        booking.setStatus(status);
        if (booking.getGarageId() == null) {
            booking.setGarageId(garageId);
        }
        if (adminNotes != null) booking.setAdminNotes(adminNotes);
        if (suggestedDate != null) booking.setSuggestedDate(suggestedDate);
        if (suggestedTime != null) booking.setSuggestedTime(suggestedTime);
        if ("confirmed".equals(status)) {
            booking.setConfirmedAt(LocalDateTime.now());
        }

        Booking saved = bookingRepository.save(booking);
        activityLogService.log("UPDATE", "BOOKING", saved.getId(),
                "updated booking " + saved.getBookingId() + " status to '" + status + "'");

        // Send acknowledgment email to customer
        if (saved.getCustomerEmail() != null && !saved.getCustomerEmail().isBlank()) {
            if ("confirmed".equals(status)) {
                emailService.sendBookingAcknowledgmentEmail(
                        saved.getCustomerEmail(), saved.getCustomerName(),
                        saved.getBookingId(), adminNotes,
                        saved.getPreferredDate(), saved.getPreferredTime(), false);
            } else if ("rescheduled".equals(status)) {
                emailService.sendBookingAcknowledgmentEmail(
                        saved.getCustomerEmail(), saved.getCustomerName(),
                        saved.getBookingId(), adminNotes,
                        suggestedDate, suggestedTime, true);
            }
        }

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
