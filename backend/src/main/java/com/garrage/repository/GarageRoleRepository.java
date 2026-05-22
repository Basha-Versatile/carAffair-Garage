package com.garrage.repository;

import com.garrage.model.GarageRole;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface GarageRoleRepository extends MongoRepository<GarageRole, String> {
    List<GarageRole> findByGarageIdAndIsActiveTrue(String garageId);
    List<GarageRole> findByGarageId(String garageId);
    Optional<GarageRole> findByIdAndGarageId(String id, String garageId);
    boolean existsByGarageIdAndNameIgnoreCase(String garageId, String name);
}
