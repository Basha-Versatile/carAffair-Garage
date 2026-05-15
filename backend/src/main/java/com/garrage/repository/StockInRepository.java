package com.garrage.repository;

import com.garrage.model.StockInRecord;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StockInRepository extends MongoRepository<StockInRecord, String> {
    List<StockInRecord> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
