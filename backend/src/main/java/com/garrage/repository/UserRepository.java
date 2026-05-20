package com.garrage.repository;

import com.garrage.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {
    Optional<User> findFirstByPhone(String phone);
    Optional<User> findFirstByPhoneAndRole(String phone, String role);
    List<User> findByGarageId(String garageId);
    boolean existsByPhone(String phone);
    boolean existsByEmail(String email);
}
