package com.garrage.repository;

import com.garrage.model.Vehicle;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface VehicleRepository extends MongoRepository<Vehicle, String> {
    List<Vehicle> findByGarageId(String garageId);
    Optional<Vehicle> findByRegistrationNumberAndGarageId(String regNumber, String garageId);
    List<Vehicle> findByRegistrationNumberContainingIgnoreCaseAndGarageId(String regNumber, String garageId);
    List<Vehicle> findByCustomerIdAndGarageId(String customerId, String garageId);
}
