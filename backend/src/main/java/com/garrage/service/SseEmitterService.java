package com.garrage.service;

import com.garrage.model.Notification;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

@Slf4j
@Service
public class SseEmitterService {

    // userId -> list of emitters (supports multiple tabs/devices)
    private final Map<String, CopyOnWriteArrayList<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(String userId) {
        SseEmitter emitter = new SseEmitter(30 * 60 * 1000L); // 30 minute timeout

        emitters.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(emitter);

        emitter.onCompletion(() -> removeEmitter(userId, emitter));
        emitter.onTimeout(() -> removeEmitter(userId, emitter));
        emitter.onError(e -> removeEmitter(userId, emitter));

        // Send initial connection event
        try {
            emitter.send(SseEmitter.event().name("connected").data("ok"));
        } catch (IOException e) {
            removeEmitter(userId, emitter);
        }

        log.debug("SSE subscription added for user {}, total connections: {}",
                userId, emitters.getOrDefault(userId, new CopyOnWriteArrayList<>()).size());
        return emitter;
    }

    public void pushToUser(String userId, Notification notification) {
        List<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters == null || userEmitters.isEmpty()) return;

        for (SseEmitter emitter : userEmitters) {
            try {
                emitter.send(SseEmitter.event()
                        .name("notification")
                        .data(notification));
            } catch (Exception e) {
                removeEmitter(userId, emitter);
                try {
                    emitter.completeWithError(e);
                } catch (Exception ignored) {}
            }
        }
    }

    public void pushToGarage(String garageId, Notification notification, List<String> userIds) {
        for (String userId : userIds) {
            pushToUser(userId, notification);
        }
    }

    public void sendHeartbeat() {
        emitters.forEach((userId, userEmitters) -> {
            for (SseEmitter emitter : userEmitters) {
                try {
                    emitter.send(SseEmitter.event().name("heartbeat").data("ping"));
                } catch (Exception e) {
                    removeEmitter(userId, emitter);
                    try {
                        emitter.completeWithError(e);
                    } catch (Exception ignored) {}
                }
            }
        });
    }

    private void removeEmitter(String userId, SseEmitter emitter) {
        CopyOnWriteArrayList<SseEmitter> userEmitters = emitters.get(userId);
        if (userEmitters != null) {
            userEmitters.remove(emitter);
            if (userEmitters.isEmpty()) {
                emitters.remove(userId);
            }
        }
    }

    public int getActiveConnectionCount() {
        return emitters.values().stream().mapToInt(List::size).sum();
    }
}
