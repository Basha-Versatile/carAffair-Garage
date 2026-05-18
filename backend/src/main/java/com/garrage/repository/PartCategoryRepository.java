package com.garrage.repository;

import com.garrage.model.PartCategory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PartCategoryRepository extends MongoRepository<PartCategory, String> {
    List<PartCategory> findByGarageId(String garageId);
    Optional<PartCategory> findByNameIgnoreCaseAndGarageId(String name, String garageId);
}
