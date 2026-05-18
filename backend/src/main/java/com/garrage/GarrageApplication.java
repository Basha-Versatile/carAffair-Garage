package com.garrage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

import com.garrage.config.JwtProperties;
import com.garrage.config.OtpProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, OtpProperties.class})
@EnableAsync
public class GarrageApplication {

    public static void main(String[] args) {
        SpringApplication.run(GarrageApplication.class, args);
    }
}
