package com.garrage.repository;

import com.garrage.model.GarageRegistration;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface GarageRegistrationRepository extends MongoRepository<GarageRegistration, String> {
    List<GarageRegistration> findByStatus(String status);
    List<GarageRegistration> findAllByOrderByCreatedAtDesc();
    boolean existsByPhoneAndStatusNot(String phone, String status);
    boolean existsByEmailAndStatusNot(String email, String status);
}
