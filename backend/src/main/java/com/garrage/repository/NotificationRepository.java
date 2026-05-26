package com.garrage.repository;

import com.garrage.model.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

public interface NotificationRepository extends MongoRepository<Notification, String> {

    @Query("{ 'garageId': ?0, $or: [ { 'recipientUserId': ?1 }, { 'recipientUserId': 'all' } ] }")
    Page<Notification> findByGarageIdAndRecipient(String garageId, String userId, Pageable pageable);

    @Query(value = "{ 'garageId': ?0, 'read': false, $or: [ { 'recipientUserId': ?1 }, { 'recipientUserId': 'all' } ] }", count = true)
    long countUnreadByGarageIdAndRecipient(String garageId, String userId);

    // For super_admin (no garageId)
    Page<Notification> findByRecipientUserIdOrderByCreatedAtDesc(String recipientUserId, Pageable pageable);

    long countByRecipientUserIdAndReadFalse(String recipientUserId);
}
