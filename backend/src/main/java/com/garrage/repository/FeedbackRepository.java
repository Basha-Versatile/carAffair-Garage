package com.garrage.repository;

import com.garrage.model.ServiceFeedback;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface FeedbackRepository extends MongoRepository<ServiceFeedback, String> {
    List<ServiceFeedback> findByGarageId(String garageId);
}
