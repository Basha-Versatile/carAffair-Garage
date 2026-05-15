package com.garrage.repository;

import com.garrage.model.CounterSale;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface CounterSaleRepository extends MongoRepository<CounterSale, String> {
    List<CounterSale> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
