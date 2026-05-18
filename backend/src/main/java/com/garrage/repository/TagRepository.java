package com.garrage.repository;

import com.garrage.model.Tag;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends MongoRepository<Tag, String> {
    List<Tag> findByGarageId(String garageId);
    List<Tag> findByGarageIdAndType(String garageId, String type);
    Optional<Tag> findByNameIgnoreCaseAndGarageId(String name, String garageId);
}
