package com.garrage.repository;

import com.garrage.model.ServicePackage;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ServicePackageRepository extends MongoRepository<ServicePackage, String> {

    List<ServicePackage> findByGarageIdAndIsActiveTrue(String garageId);

    List<ServicePackage> findByGarageId(String garageId);

    Optional<ServicePackage> findByIdAndGarageId(String id, String garageId);
}
