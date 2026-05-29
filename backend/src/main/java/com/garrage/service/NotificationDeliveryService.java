package com.garrage.service;

import com.garrage.model.Notification;
import com.garrage.model.NotificationPreference;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
import com.garrage.repository.NotificationPreferenceRepository;
import com.garrage.repository.NotificationRepository;
import com.garrage.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Separate bean for async notification delivery.
 * Extracted from NotificationService so that Spring AOP proxy
 * can correctly intercept the @Async annotation (self-invocation
 * within the same bean bypasses @Async).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationDeliveryService {

    private final NotificationRepository notificationRepository;
    private final NotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;
    private final GarageRoleRepository garageRoleRepository;
    private final SseEmitterService sseEmitterService;

    private static final Map<String, String> CATEGORY_PERMISSION_MAP = Map.of(
            "INVENTORY", "INVENTORY:VIEW",
            "APPOINTMENTS", "APPOINTMENTS:VIEW",
            "PAYMENTS", "INVOICES:VIEW"
    );

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
            log.info("Notification saved: {} -> {} ({})", type, recipientUserId, title);

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
                log.info("SSE pushed to {} users in garage {}", userIds.size(), garageId);
            } else {
                // Direct push to specific user
                if (isCategoryEnabledForUser(recipientUserId, category)) {
                    sseEmitterService.pushToUser(recipientUserId, saved);
                    log.info("SSE pushed to user {}", recipientUserId);
                } else {
                    log.info("Notification category {} disabled for user {}, skipping SSE push",
                            category, recipientUserId);
                }
            }
        } catch (Exception e) {
            log.error("Failed to save/deliver notification: {}", e.getMessage(), e);
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
