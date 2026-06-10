package com.garrage.repository;

import com.garrage.model.Attendance;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends MongoRepository<Attendance, String> {

    List<Attendance> findByGarageIdAndDate(String garageId, String date);

    Optional<Attendance> findByGarageIdAndStaffIdAndDate(String garageId, String staffId, String date);

    @Query("{ 'garageId': ?0, 'staffId': ?1, 'date': { $gte: ?2, $lte: ?3 } }")
    List<Attendance> findByGarageIdAndStaffIdAndDateRange(
            String garageId, String staffId, String startDate, String endDate);

    @Query("{ 'garageId': ?0, 'date': { $gte: ?1, $lte: ?2 } }")
    List<Attendance> findByGarageIdAndDateRange(
            String garageId, String startDate, String endDate);

    long countByGarageIdAndDateAndStatus(String garageId, String date, String status);
}
