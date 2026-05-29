package com.garrage.service;

import com.garrage.model.Notification;
import com.garrage.model.NotificationPreference;
import com.garrage.model.User;
import com.garrage.repository.NotificationPreferenceRepository;
import com.garrage.repository.NotificationRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final NotificationDeliveryService deliveryService;
    private final MongoTemplate mongoTemplate;

    /**
     * Send a notification to a specific user.
     */
    public void notify(String garageId, String recipientUserId,
                       String type, String category, String priority,
                       String title, String message, String actionUrl,
                       String entityType, String entityId) {
        deliveryService.saveAndDeliverAsync(garageId, recipientUserId, null,
                type, category, priority, title, message, actionUrl, entityType, entityId);
    }

    /**
     * Broadcast a notification to all users in a garage (admin + staff).
     */
    public void notifyGarage(String garageId,
                             String type, String category, String priority,
                             String title, String message, String actionUrl,
                             String entityType, String entityId) {
        deliveryService.saveAndDeliverAsync(garageId, "all", null,
                type, category, priority, title, message, actionUrl, entityType, entityId);
    }

    /**
     * Notify the garage admin(s) only.
     */
    public void notifyAdmin(String garageId,
                            String type, String category, String priority,
                            String title, String message, String actionUrl,
                            String entityType, String entityId) {
        // Find the garage admin user
        List<User> admins = userRepository.findByGarageIdAndRole(garageId, "garage_admin");
        if (admins.isEmpty()) {
            log.warn("No garage_admin users found for garageId={}, notification not sent: {}", garageId, title);
        }
        for (User admin : admins) {
            deliveryService.saveAndDeliverAsync(garageId, admin.getId(), "garage_admin",
                    type, category, priority, title, message, actionUrl, entityType, entityId);
        }
    }

    /**
     * Notify super admins (no garageId).
     */
    public void notifySuperAdmin(String type, String category, String priority,
                                 String title, String message, String actionUrl,
                                 String entityType, String entityId) {
        List<User> superAdmins = userRepository.findByGarageIdAndRole(null, "super_admin");
        // Also try without garageId filter for super admins
        if (superAdmins.isEmpty()) {
            superAdmins = mongoTemplate.find(
                    Query.query(Criteria.where("role").is("super_admin")),
                    User.class
            );
        }
        if (superAdmins.isEmpty()) {
            log.warn("No super_admin users found, notification not sent: {}", title);
        }
        for (User sa : superAdmins) {
            deliveryService.saveAndDeliverAsync(null, sa.getId(), "super_admin",
                    type, category, priority, title, message, actionUrl, entityType, entityId);
        }
    }

    // ─── Query methods ───

    public Page<Notification> getNotifications(String userId, String garageId, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        if (garageId != null) {
            return notificationRepository.findByGarageIdAndRecipient(garageId, userId, pageable);
        } else {
            return notificationRepository.findByRecipientUserIdOrderByCreatedAtDesc(userId, pageable);
        }
    }

    public long getUnreadCount(String userId, String garageId) {
        if (garageId != null) {
            return notificationRepository.countUnreadByGarageIdAndRecipient(garageId, userId);
        } else {
            return notificationRepository.countByRecipientUserIdAndReadFalse(userId);
        }
    }

    public void markAsRead(String notificationId, String userId) {
        Query query = Query.query(Criteria.where("id").is(notificationId));
        Update update = new Update()
                .set("read", true)
                .set("readAt", LocalDateTime.now());
        mongoTemplate.updateFirst(query, update, Notification.class);
    }

    public void markAllAsRead(String userId, String garageId) {
        Criteria criteria = new Criteria().andOperator(
                Criteria.where("read").is(false),
                new Criteria().orOperator(
                        Criteria.where("recipientUserId").is(userId),
                        Criteria.where("recipientUserId").is("all")
                )
        );
        if (garageId != null) {
            criteria = criteria.and("garageId").is(garageId);
        }

        Query query = Query.query(criteria);
        Update update = new Update()
                .set("read", true)
                .set("readAt", LocalDateTime.now());
        mongoTemplate.updateMulti(query, update, Notification.class);
    }

    // ─── Preferences ───

    public NotificationPreference getPreferences(String userId, String garageId) {
        return preferenceRepository.findByUserId(userId)
                .orElse(NotificationPreference.builder()
                        .userId(userId)
                        .garageId(garageId)
                        .inventoryEnabled(true)
                        .appointmentsEnabled(true)
                        .paymentsEnabled(true)
                        .staffEnabled(true)
                        .systemEnabled(true)
                        .pushEnabled(true)
                        .build());
    }

    public NotificationPreference updatePreferences(String userId, String garageId,
                                                    NotificationPreference prefs) {
        NotificationPreference existing = preferenceRepository.findByUserId(userId).orElse(null);
        if (existing != null) {
            existing.setInventoryEnabled(prefs.isInventoryEnabled());
            existing.setAppointmentsEnabled(prefs.isAppointmentsEnabled());
            existing.setPaymentsEnabled(prefs.isPaymentsEnabled());
            existing.setStaffEnabled(prefs.isStaffEnabled());
            existing.setSystemEnabled(prefs.isSystemEnabled());
            existing.setPushEnabled(prefs.isPushEnabled());
            return preferenceRepository.save(existing);
        } else {
            prefs.setUserId(userId);
            prefs.setGarageId(garageId);
            return preferenceRepository.save(prefs);
        }
    }
}
