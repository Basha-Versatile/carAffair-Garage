package com.garrage.service;

import com.garrage.model.GarageRole;
import com.garrage.model.Notification;
import com.garrage.model.NotificationPreference;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
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
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final GarageRoleRepository garageRoleRepository;
    private final SseEmitterService sseEmitterService;
    private final MongoTemplate mongoTemplate;

    private static final Map<String, String> CATEGORY_PREF_MAP = Map.of(
            "INVENTORY", "inventoryEnabled",
            "APPOINTMENTS", "appointmentsEnabled",
            "PAYMENTS", "paymentsEnabled",
            "STAFF", "staffEnabled",
            "SYSTEM", "systemEnabled"
    );

    // Maps notification category to the permission required to receive it
    private static final Map<String, String> CATEGORY_PERMISSION_MAP = Map.of(
            "INVENTORY", "INVENTORY:VIEW",
            "APPOINTMENTS", "APPOINTMENTS:VIEW",
            "PAYMENTS", "INVOICES:VIEW"
    );

    /**
     * Send a notification to a specific user.
     */
    public void notify(String garageId, String recipientUserId,
                       String type, String category, String priority,
                       String title, String message, String actionUrl,
                       String entityType, String entityId) {
        saveAndDeliverAsync(garageId, recipientUserId, null,
                type, category, priority, title, message, actionUrl, entityType, entityId);
    }

    /**
     * Broadcast a notification to all users in a garage (admin + staff).
     */
    public void notifyGarage(String garageId,
                             String type, String category, String priority,
                             String title, String message, String actionUrl,
                             String entityType, String entityId) {
        saveAndDeliverAsync(garageId, "all", null,
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
        for (User admin : admins) {
            saveAndDeliverAsync(garageId, admin.getId(), "garage_admin",
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
        for (User sa : superAdmins) {
            saveAndDeliverAsync(null, sa.getId(), "super_admin",
                    type, category, priority, title, message, actionUrl, entityType, entityId);
        }
    }

    @Async
    public void saveAndDeliverAsync(String garageId, String recipientUserId,
                                    String recipientRole,
                                    String type, String category, String priority,
                                    String title, String message, String actionUrl,
                                    String entityType, String entityId) {
        try {
            Notification notification = Notification.builder()
                    .garageId(garageId)
                    .recipientUserId(recipientUserId)
                    .recipientRole(recipientRole)
                    .type(type)
                    .category(category)
                    .priority(priority)
                    .title(title)
                    .message(message)
                    .actionUrl(actionUrl)
                    .entityType(entityType)
                    .entityId(entityId)
                    .read(false)
                    .build();

            Notification saved = notificationRepository.save(notification);
            log.debug("Notification saved: {} -> {} ({})", type, recipientUserId, title);

            // Push via SSE
            if ("all".equals(recipientUserId) && garageId != null) {
                // Broadcast to garage users who have both permission and preference enabled
                List<User> garageUsers = userRepository.findByGarageId(garageId);
                List<String> userIds = garageUsers.stream()
                        .filter(u -> hasPermissionForCategory(u, garageId, category))
                        .filter(u -> isCategoryEnabledForUser(u.getId(), category))
                        .map(User::getId)
                        .collect(Collectors.toList());
                sseEmitterService.pushToGarage(garageId, saved, userIds);
            } else {
                // Direct push to specific user
                if (isCategoryEnabledForUser(recipientUserId, category)) {
                    sseEmitterService.pushToUser(recipientUserId, saved);
                }
            }
        } catch (Exception e) {
            log.error("Failed to save/deliver notification: {}", e.getMessage(), e);
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

    private boolean isCategoryEnabledForUser(String userId, String category) {
        if (category == null) return true;
        NotificationPreference prefs = preferenceRepository.findByUserId(userId).orElse(null);
        if (prefs == null) return true; // default: all enabled

        return switch (category) {
            case "INVENTORY" -> prefs.isInventoryEnabled();
            case "APPOINTMENTS" -> prefs.isAppointmentsEnabled();
            case "PAYMENTS" -> prefs.isPaymentsEnabled();
            case "STAFF" -> prefs.isStaffEnabled();
            case "SYSTEM" -> prefs.isSystemEnabled();
            default -> true;
        };
    }

    /**
     * Check if a user has the required permission for a notification category.
     * Admins (super_admin, garage_admin) always have all permissions.
     * Staff must have the specific module permission in their role.
     */
    private boolean hasPermissionForCategory(User user, String garageId, String category) {
        if (category == null) return true;

        // Admins always receive all notifications
        String role = user.getRole();
        if ("super_admin".equals(role) || "garage_admin".equals(role)) {
            return true;
        }

        // SYSTEM and STAFF notifications go to everyone
        String requiredPermission = CATEGORY_PERMISSION_MAP.get(category);
        if (requiredPermission == null) {
            return true;
        }

        // For garage_staff, check their role's permissions
        if ("garage_staff".equals(role) && user.getGarageRoleId() != null) {
            return garageRoleRepository.findByIdAndGarageId(user.getGarageRoleId(), garageId)
                    .map(garageRole -> {
                        List<String> permissions = garageRole.getPermissions();
                        if (permissions == null) return false;
                        // MANAGE implies VIEW
                        String module = requiredPermission.split(":")[0];
                        return permissions.contains(requiredPermission)
                                || permissions.contains(module + ":MANAGE");
                    })
                    .orElse(false);
        }

        // Other roles (customer, vendor) don't get garage notifications
        return false;
    }
}
