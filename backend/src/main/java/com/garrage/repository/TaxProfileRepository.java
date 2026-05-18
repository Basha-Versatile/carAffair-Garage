package com.garrage.repository;

import com.garrage.model.TaxProfile;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface TaxProfileRepository extends MongoRepository<TaxProfile, String> {
    List<TaxProfile> findByGarageId(String garageId);
    List<TaxProfile> findByGarageIdAndTaxType(String garageId, String taxType);
    Optional<TaxProfile> findByIdAndGarageId(String id, String garageId);
}
