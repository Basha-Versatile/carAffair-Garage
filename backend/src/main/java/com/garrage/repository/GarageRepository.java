package com.garrage.repository;

import com.garrage.model.Garage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GarageRepository extends MongoRepository<Garage, String> {
    List<Garage> findByIsActiveTrue();
    Optional<Garage> findByAdminUserId(String adminUserId);
    Optional<Garage> findByPhone(String phone);
    Optional<Garage> findByEmail(String email);
}
