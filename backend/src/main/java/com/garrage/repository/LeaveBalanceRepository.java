package com.garrage.repository;

import com.garrage.model.LeaveBalance;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface LeaveBalanceRepository extends MongoRepository<LeaveBalance, String> {

    Optional<LeaveBalance> findByGarageIdAndStaffIdAndYear(String garageId, String staffId, String year);
}
