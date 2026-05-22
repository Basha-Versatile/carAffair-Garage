package com.garrage.service;

import com.garrage.model.ActivityLog;
import com.garrage.model.User;
import com.garrage.repository.ActivityLogRepository;
import com.garrage.repository.UserRepository;
import com.garrage.security.UserPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.support.PageableExecutionUtils;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final MongoTemplate mongoTemplate;

    /**
     * Log an activity. Extracts user info from SecurityContext synchronously,
     * then delegates to async save so it never slows down the caller.
     */
    public void log(String action, String entityType,
                    String entityId, String descriptionSuffix) {
        UserPrincipal principal = getCurrentPrincipal();
        if (principal == null) {
            log.warn("Cannot log activity: no authenticated user");
            return;
        }
        saveLogAsync(principal.getGarageId(), principal.getId(),
                principal.getRole(), action, entityType, entityId, descriptionSuffix);
    }

    @Async
    public void saveLogAsync(String garageId, String userId, String userRole,
                             String action, String entityType,
                             String entityId, String descriptionSuffix) {
        try {
            String userName = "Unknown";
            String staffTitle = null;

            User user = userRepository.findById(userId).orElse(null);
            if (user != null) {
                userName = user.getName() != null ? user.getName() : user.getPhone();
                staffTitle = user.getStaffTitle();
            }

            String roleLabel = staffTitle != null ? staffTitle
                    : ("garage_admin".equals(userRole) ? "Owner" : userRole);
            String fullDescription = userName + " (" + roleLabel + ") " + descriptionSuffix;

            ActivityLog activityLog = ActivityLog.builder()
                    .garageId(garageId)
                    .userId(userId)
                    .userName(userName)
                    .userRole(userRole)
                    .staffTitle(staffTitle)
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .description(fullDescription)
                    .build();

            activityLogRepository.save(activityLog);
            log.debug("Activity logged: {}", fullDescription);
        } catch (Exception e) {
            log.error("Failed to log activity: {}", e.getMessage(), e);
        }
    }

    /**
     * Fetch logs with flexible filters and pagination.
     */
    public Page<ActivityLog> getLogs(String garageId, String action,
                                    String entityType, String userId,
                                    LocalDateTime from, LocalDateTime to,
                                    int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Query query = new Query();
        query.addCriteria(Criteria.where("garageId").is(garageId));

        if (action != null && !action.isBlank()) {
            query.addCriteria(Criteria.where("action").is(action));
        }
        if (entityType != null && !entityType.isBlank()) {
            query.addCriteria(Criteria.where("entityType").is(entityType));
        }
        if (userId != null && !userId.isBlank()) {
            query.addCriteria(Criteria.where("userId").is(userId));
        }
        if (from != null && to != null) {
            query.addCriteria(Criteria.where("createdAt").gte(from).lte(to));
        } else if (from != null) {
            query.addCriteria(Criteria.where("createdAt").gte(from));
        } else if (to != null) {
            query.addCriteria(Criteria.where("createdAt").lte(to));
        }

        query.with(pageable);

        List<ActivityLog> logs = mongoTemplate.find(query, ActivityLog.class);
        long count = mongoTemplate.count(
                Query.of(query).limit(-1).skip(-1), ActivityLog.class);

        return PageableExecutionUtils.getPage(logs, pageable, () -> count);
    }

    private UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
