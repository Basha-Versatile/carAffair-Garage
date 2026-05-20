package com.garrage.repository;

import com.garrage.model.ExpenseLabel;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExpenseLabelRepository extends MongoRepository<ExpenseLabel, String> {
    List<ExpenseLabel> findByGarageIdOrderByCreatedAtDesc(String garageId);
}
