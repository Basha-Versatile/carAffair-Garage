package com.garrage.repository;

import com.garrage.model.ServiceEntry;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceEntryRepository extends MongoRepository<ServiceEntry, String> {
    List<ServiceEntry> findByGarageId(String garageId);
    Optional<ServiceEntry> findByIdAndGarageId(String id, String garageId);
    List<ServiceEntry> findByGarageIdAndCategoryId(String garageId, String categoryId);
}
