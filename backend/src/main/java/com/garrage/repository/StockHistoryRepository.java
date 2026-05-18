package com.garrage.repository;

import com.garrage.model.StockHistory;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface StockHistoryRepository extends MongoRepository<StockHistory, String> {
    List<StockHistory> findByGarageIdAndPartIdOrderByCreatedAtDesc(String garageId, String partId);
    List<StockHistory> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
