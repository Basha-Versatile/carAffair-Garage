package com.garrage.repository;

import com.garrage.model.Booking;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface BookingRepository extends MongoRepository<Booking, String> {
    List<Booking> findByCustomerPhoneOrderByCreatedAtDesc(String phone);
    List<Booking> findByGarageIdOrderByCreatedAtDesc(String garageId);
    Optional<Booking> findByBookingId(String bookingId);
    List<Booking> findByStatus(String status);
}
