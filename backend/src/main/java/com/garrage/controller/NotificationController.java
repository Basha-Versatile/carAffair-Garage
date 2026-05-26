package com.garrage.controller;

import com.garrage.config.WebPushProperties;
import com.garrage.dto.response.ApiResponse;
import com.garrage.model.Notification;
import com.garrage.model.NotificationPreference;
import com.garrage.model.PushSubscription;
import com.garrage.repository.PushSubscriptionRepository;
import com.garrage.security.JwtTokenProvider;
import com.garrage.security.TenantContext;
import com.garrage.security.UserPrincipal;
import com.garrage.service.NotificationService;
import com.garrage.service.SseEmitterService;
import io.jsonwebtoken.Claims;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final SseEmitterService sseEmitterService;
    private final PushSubscriptionRepository pushSubscriptionRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final WebPushProperties webPushProperties;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<Notification>>> getNotifications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();
        Page<Notification> notifications = notificationService.getNotifications(
                principal.getId(), garageId, page, size);
        return ResponseEntity.ok(ApiResponse.ok(notifications));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<ApiResponse<Long>> getUnreadCount() {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();
        long count = notificationService.getUnreadCount(principal.getId(), garageId);
        return ResponseEntity.ok(ApiResponse.ok(count));
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable String id) {
        UserPrincipal principal = getCurrentPrincipal();
        notificationService.markAsRead(id, principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<ApiResponse<Void>> markAllAsRead() {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();
        notificationService.markAllAsRead(principal.getId(), garageId);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    /**
     * SSE endpoint for real-time notifications.
     * EventSource API cannot set headers, so token is passed as query param.
     */
    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@RequestParam("token") String token) {
        if (!jwtTokenProvider.validateToken(token)) {
            log.warn("Invalid token for SSE stream");
            SseEmitter emitter = new SseEmitter(0L);
            emitter.completeWithError(new RuntimeException("Invalid token"));
            return emitter;
        }

        Claims claims = jwtTokenProvider.getClaimsFromToken(token);
        String userId = claims.getSubject();
        log.info("SSE stream connected for user {}", userId);
        return sseEmitterService.subscribe(userId);
    }

    @GetMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> getPreferences() {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();
        NotificationPreference prefs = notificationService.getPreferences(
                principal.getId(), garageId);
        return ResponseEntity.ok(ApiResponse.ok(prefs));
    }

    @PutMapping("/preferences")
    public ResponseEntity<ApiResponse<NotificationPreference>> updatePreferences(
            @RequestBody NotificationPreference prefs) {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();
        NotificationPreference updated = notificationService.updatePreferences(
                principal.getId(), garageId, prefs);
        return ResponseEntity.ok(ApiResponse.ok(updated));
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<ApiResponse<Map<String, String>>> getVapidPublicKey() {
        return ResponseEntity.ok(ApiResponse.ok(
                Map.of("publicKey", webPushProperties.getPublicKey())
        ));
    }

    @PostMapping("/push-subscribe")
    public ResponseEntity<ApiResponse<Void>> subscribePush(@RequestBody Map<String, String> body) {
        UserPrincipal principal = getCurrentPrincipal();
        String garageId = TenantContext.getGarageId();

        String endpoint = body.get("endpoint");
        String p256dh = body.get("p256dh");
        String auth = body.get("auth");
        String userAgent = body.get("userAgent");

        // Delete all old subscriptions for this user, then save the fresh one.
        // This prevents stale subscriptions (created with old VAPID keys) from piling up.
        pushSubscriptionRepository.deleteByUserId(principal.getId());

        PushSubscription subscription = PushSubscription.builder()
                .endpoint(endpoint)
                .userId(principal.getId())
                .garageId(garageId)
                .p256dh(p256dh)
                .auth(auth)
                .userAgent(userAgent)
                .build();
        pushSubscriptionRepository.save(subscription);

        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    @DeleteMapping("/push-subscribe")
    public ResponseEntity<ApiResponse<Void>> unsubscribePush(@RequestBody Map<String, String> body) {
        String endpoint = body.get("endpoint");
        pushSubscriptionRepository.deleteByEndpoint(endpoint);
        return ResponseEntity.ok(ApiResponse.ok(null));
    }

    private UserPrincipal getCurrentPrincipal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return (UserPrincipal) auth.getPrincipal();
    }
}
