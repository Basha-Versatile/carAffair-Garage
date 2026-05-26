package com.garrage.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "app.web-push")
public class WebPushProperties {

    /**
     * VAPID public key (Base64 URL-safe encoded, 65 bytes uncompressed EC P-256 point).
     */
    private String publicKey;

    /**
     * VAPID private key (Base64 URL-safe encoded, 32 bytes raw EC P-256 private key).
     */
    private String privateKey;

    /**
     * VAPID subject — mailto: or https: URL identifying the application server.
     */
    private String subject = "mailto:help@caraffair.co.uk";
}
