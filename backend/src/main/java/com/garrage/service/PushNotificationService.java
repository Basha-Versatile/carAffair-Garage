package com.garrage.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garrage.config.WebPushProperties;
import com.garrage.model.Notification;
import com.garrage.model.PushSubscription;
import com.garrage.repository.PushSubscriptionRepository;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Encoding;
import nl.martijndwars.webpush.PushService;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.security.GeneralSecurityException;
import java.security.Security;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class PushNotificationService {

    private final PushSubscriptionRepository subscriptionRepository;
    private final WebPushProperties webPushProperties;
    private final ObjectMapper objectMapper;
    private PushService pushService;

    static {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    public PushNotificationService(PushSubscriptionRepository subscriptionRepository,
                                   WebPushProperties webPushProperties,
                                   ObjectMapper objectMapper) {
        this.subscriptionRepository = subscriptionRepository;
        this.webPushProperties = webPushProperties;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    public void init() {
        try {
            if (webPushProperties.getPublicKey() != null && webPushProperties.getPrivateKey() != null) {
                pushService = new PushService()
                        .setPublicKey(webPushProperties.getPublicKey())
                        .setPrivateKey(webPushProperties.getPrivateKey())
                        .setSubject(webPushProperties.getSubject());
                log.info("Web Push service initialized with VAPID keys");
            } else {
                log.warn("VAPID keys not configured, push notifications disabled");
            }
        } catch (GeneralSecurityException e) {
            log.error("Failed to initialize Web Push service: {}", e.getMessage(), e);
        }
    }

    /**
     * Send push notification to a specific user (all their subscriptions).
     */
    public void sendToUser(String userId, Notification notification) {
        if (pushService == null) {
            log.debug("Push service not initialized, skipping");
            return;
        }

        List<PushSubscription> subscriptions = subscriptionRepository.findByUserId(userId);
        if (subscriptions.isEmpty()) {
            log.debug("No push subscriptions for user {}", userId);
            return;
        }

        String payload = buildPayload(notification);

        for (PushSubscription sub : subscriptions) {
            sendPushToSubscription(sub, payload);
        }
    }

    /**
     * Send push to all subscriptions in a garage.
     */
    public void sendToGarage(String garageId, Notification notification) {
        if (pushService == null) return;

        List<PushSubscription> subscriptions = subscriptionRepository.findByGarageId(garageId);
        String payload = buildPayload(notification);

        for (PushSubscription sub : subscriptions) {
            sendPushToSubscription(sub, payload);
        }
    }

    private void sendPushToSubscription(PushSubscription sub, String payload) {
        try {
            nl.martijndwars.webpush.Notification webPushNotification =
                    new nl.martijndwars.webpush.Notification(
                            sub.getEndpoint(),
                            sub.getP256dh(),
                            sub.getAuth(),
                            payload.getBytes()
                    );

            org.apache.http.HttpResponse response = pushService.send(webPushNotification, Encoding.AES128GCM);
            int statusCode = response.getStatusLine().getStatusCode();

            if (statusCode >= 200 && statusCode < 300) {
                log.info("Push sent successfully (status {}) to: {}...",
                        statusCode, sub.getEndpoint().substring(0, Math.min(60, sub.getEndpoint().length())));
            } else if (statusCode == 404 || statusCode == 410) {
                log.info("Push subscription expired (status {}), removing: {}", statusCode, sub.getId());
                subscriptionRepository.delete(sub);
            } else {
                String body = "";
                try {
                    body = new String(response.getEntity().getContent().readAllBytes());
                } catch (Exception ignored) {}
                log.warn("Push failed with status {}: {} | body: {} | endpoint: {}",
                        statusCode, response.getStatusLine().getReasonPhrase(), body,
                        sub.getEndpoint().substring(0, Math.min(80, sub.getEndpoint().length())));
            }
        } catch (Exception e) {
            log.warn("Failed to send push to endpoint {}: {}", sub.getEndpoint(), e.getMessage(), e);
        }
    }

    private String buildPayload(Notification notification) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                    "title", notification.getTitle() != null ? notification.getTitle() : "Car Affair",
                    "message", notification.getMessage() != null ? notification.getMessage() : "New notification",
                    "actionUrl", notification.getActionUrl() != null ? notification.getActionUrl() : "/dashboard",
                    "id", notification.getId() != null ? notification.getId() : "",
                    "priority", notification.getPriority() != null ? notification.getPriority() : "normal"
            ));
        } catch (Exception e) {
            return "{\"title\":\"Car Affair\",\"message\":\"New notification\"}";
        }
    }
}
