package com.garrage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.garrage.config.JwtProperties;
import com.garrage.config.OtpProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, OtpProperties.class})
public class GarrageApplication {

    public static void main(String[] args) {
        SpringApplication.run(GarrageApplication.class, args);
    }
}
