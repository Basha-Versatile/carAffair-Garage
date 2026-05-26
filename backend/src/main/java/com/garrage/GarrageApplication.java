package com.garrage;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

import com.garrage.config.JwtProperties;
import com.garrage.config.OtpProperties;
import com.garrage.config.SurePassProperties;
import com.garrage.config.WebPushProperties;

@SpringBootApplication
@EnableConfigurationProperties({JwtProperties.class, OtpProperties.class, SurePassProperties.class, WebPushProperties.class})
@EnableAsync
public class GarrageApplication {

    public static void main(String[] args) {
        SpringApplication.run(GarrageApplication.class, args);
    }
}
