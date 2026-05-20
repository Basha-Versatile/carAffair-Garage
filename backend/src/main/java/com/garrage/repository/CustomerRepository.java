package com.garrage.repository;

import com.garrage.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    List<Customer> findByGarageId(String garageId);
    Optional<Customer> findByIdAndGarageId(String id, String garageId);
    Optional<Customer> findFirstByPhoneAndGarageId(String phone, String garageId);
    boolean existsByPhoneAndGarageId(String phone, String garageId);
    List<Customer> findByGarageIdAndNameContainingIgnoreCase(String garageId, String name);
    List<Customer> findByGarageIdAndPhoneContaining(String garageId, String phone);
}
