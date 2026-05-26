package com.garrage.config;

import com.garrage.service.SseEmitterService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;

@Configuration
@EnableScheduling
@RequiredArgsConstructor
public class SchedulingConfig {

    private final SseEmitterService sseEmitterService;

    /**
     * Send heartbeat to all SSE connections every 30 seconds to keep them alive.
     */
    @Scheduled(fixedRate = 30000)
    public void sseHeartbeat() {
        sseEmitterService.sendHeartbeat();
    }
}
