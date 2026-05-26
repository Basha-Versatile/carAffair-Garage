package com.garrage.repository;

import com.garrage.model.NotificationPreference;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface NotificationPreferenceRepository extends MongoRepository<NotificationPreference, String> {

    Optional<NotificationPreference> findByUserId(String userId);
}
