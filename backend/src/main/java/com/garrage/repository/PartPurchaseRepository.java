package com.garrage.repository;

import com.garrage.model.PartPurchase;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PartPurchaseRepository extends MongoRepository<PartPurchase, String> {
    List<PartPurchase> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
