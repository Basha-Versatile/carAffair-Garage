package com.garrage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.otp")
public class OtpProperties {

    private boolean mock;
    private int expirySeconds;
}
