package com.garrage.repository;

import com.garrage.model.PushSubscription;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends MongoRepository<PushSubscription, String> {

    List<PushSubscription> findByUserId(String userId);

    List<PushSubscription> findByGarageId(String garageId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    void deleteByEndpoint(String endpoint);

    void deleteByUserId(String userId);
}
