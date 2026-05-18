package com.garrage.repository;

import com.garrage.model.ServiceCategory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceCategoryRepository extends MongoRepository<ServiceCategory, String> {
    List<ServiceCategory> findByGarageId(String garageId);
    Optional<ServiceCategory> findByIdAndGarageId(String id, String garageId);
    Optional<ServiceCategory> findByNameIgnoreCaseAndGarageId(String name, String garageId);
}
