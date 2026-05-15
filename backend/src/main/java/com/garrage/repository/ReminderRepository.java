package com.garrage.repository;

import com.garrage.model.ServiceReminder;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface ReminderRepository extends MongoRepository<ServiceReminder, String> {
    List<ServiceReminder> findByGarageId(String garageId);
    List<ServiceReminder> findByGarageIdAndStatus(String garageId, String status);
    Optional<ServiceReminder> findByIdAndGarageId(String id, String garageId);
}
