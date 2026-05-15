package com.garrage.repository;

import com.garrage.model.Order;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends MongoRepository<Order, String> {
    List<Order> findByGarageIdOrderByCreatedAtDesc(String garageId);
    List<Order> findByGarageIdAndStatus(String garageId, String status);
    Optional<Order> findByIdAndGarageId(String id, String garageId);
    long countByGarageIdAndStatus(String garageId, String status);
}
