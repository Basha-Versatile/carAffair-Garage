package com.garrage.repository;

import com.garrage.model.LeaveRequest;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface LeaveRequestRepository extends MongoRepository<LeaveRequest, String> {

    List<LeaveRequest> findByGarageIdOrderByCreatedAtDesc(String garageId);

    List<LeaveRequest> findByGarageIdAndStatusOrderByCreatedAtDesc(String garageId, String status);

    List<LeaveRequest> findByGarageIdAndStaffIdOrderByCreatedAtDesc(String garageId, String staffId);

    List<LeaveRequest> findByGarageIdAndStartDateBetween(String garageId, String startDate, String endDate);

    long countByGarageIdAndStaffIdAndStatusAndStartDateBetween(
            String garageId, String staffId, String status, String startDate, String endDate);
}
