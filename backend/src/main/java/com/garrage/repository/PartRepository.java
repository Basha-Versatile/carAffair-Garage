package com.garrage.repository;

import com.garrage.model.Part;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PartRepository extends MongoRepository<Part, String> {
    List<Part> findByGarageId(String garageId);
    Optional<Part> findByIdAndGarageId(String id, String garageId);
    List<Part> findByGarageIdAndStockQtyLessThanEqual(String garageId, int qty);
}
