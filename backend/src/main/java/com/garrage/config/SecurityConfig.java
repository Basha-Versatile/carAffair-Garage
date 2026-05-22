package com.garrage.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.garrage.security.JwtAuthFilter;

import lombok.RequiredArgsConstructor;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpStatus.UNAUTHORIZED.value());
                            response.setContentType("application/json");
                            Map<String, Object> body = Map.of(
                                    "timestamp", LocalDateTime.now().toString(),
                                    "status", 401,
                                    "error", "Unauthorized",
                                    "message", "Authentication required"
                            );
                            response.getWriter().write(new ObjectMapper().writeValueAsString(body));
                        })
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpStatus.FORBIDDEN.value());
                            response.setContentType("application/json");
                            Map<String, Object> body = Map.of(
                                    "timestamp", LocalDateTime.now().toString(),
                                    "status", 403,
                                    "error", "Forbidden",
                                    "message", "You do not have permission to access this resource"
                            );
                            response.getWriter().write(new ObjectMapper().writeValueAsString(body));
                        })
                )
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/bookings").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/vendors/register").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/brands").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/models").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/garage-registrations").permitAll()

                        // Super Admin only
                        .requestMatchers("/api/garages/**").hasRole("SUPER_ADMIN")
                        .requestMatchers("/api/garage-registrations/**").hasRole("SUPER_ADMIN")

                        // Customer endpoints
                        .requestMatchers(HttpMethod.GET, "/api/bookings").hasAnyRole("CUSTOMER", "SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET, "/api/bookings/**").hasAnyRole("CUSTOMER", "SUPER_ADMIN")

                        // Garage role & staff management (owner only)
                        .requestMatchers("/api/garage-roles/**").hasAnyRole("GARAGE_ADMIN", "SUPER_ADMIN")
                        .requestMatchers("/api/garage-staff/**").hasAnyRole("GARAGE_ADMIN", "SUPER_ADMIN")

                        // Activity logs (owner only)
                        .requestMatchers("/api/activity-logs/**").hasAnyRole("GARAGE_ADMIN", "SUPER_ADMIN")

                        // Garage Admin, Staff, and Super Admin endpoints
                        .requestMatchers("/api/admin/bookings/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/customers/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/vehicles/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/orders/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/parts/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/vendors").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/vendors/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/purchase-orders/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/stock-in/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/counter-sales/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/invoices/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/service-reminders/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/service-feedbacks/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/rc-lookup/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/part-categories/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/stock-history/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/part-purchases/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/manufacturers/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/expenses/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/expense-labels/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/service-categories/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/garage-services/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/tags/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")
                        .requestMatchers("/api/tax-profiles/**").hasAnyRole("GARAGE_ADMIN", "GARAGE_STAFF", "SUPER_ADMIN")

                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:3002",
                "http://localhost:8080"
        ));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
