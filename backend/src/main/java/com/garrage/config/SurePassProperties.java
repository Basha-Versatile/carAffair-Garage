package com.garrage.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import lombok.Data;

@Data
@ConfigurationProperties(prefix = "app.surepass")
public class SurePassProperties {

    private String token;
    private String baseUrl;
}
