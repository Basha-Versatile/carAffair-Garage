package com.garrage.repository;

import com.garrage.model.Manufacturer;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ManufacturerRepository extends MongoRepository<Manufacturer, String> {
    List<Manufacturer> findByGarageId(String garageId);
    Optional<Manufacturer> findByNameIgnoreCaseAndGarageId(String name, String garageId);
}
