package com.garrage.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Component;

import com.garrage.config.JwtProperties;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtBuilder;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtTokenProvider {

    private final JwtProperties jwtProperties;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8));
    }

    /** Backward-compatible overload (no permissions). */
    public String generateAccessToken(String userId, String role, String garageId, String garageName, String phone) {
        return generateAccessToken(userId, role, garageId, garageName, phone, null, null);
    }

    public String generateAccessToken(String userId, String role, String garageId,
                                       String garageName, String phone,
                                       List<String> permissions, List<String> financialModules) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getAccessTokenExpiry());

        JwtBuilder builder = Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .claim("garageId", garageId)
                .claim("garageName", garageName)
                .claim("phone", phone)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey());

        if ("garage_staff".equals(role)) {
            if (permissions != null && !permissions.isEmpty()) {
                builder.claim("permissions", permissions);
            }
            if (financialModules != null && !financialModules.isEmpty()) {
                builder.claim("financialModules", financialModules);
            }
        }

        return builder.compact();
    }

    public String generateRefreshToken(String userId) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + jwtProperties.getRefreshTokenExpiry());

        return Jwts.builder()
                .subject(userId)
                .issuedAt(now)
                .expiration(expiryDate)
                .signWith(getSigningKey())
                .compact();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String getUserIdFromToken(String token) {
        return getClaimsFromToken(token).getSubject();
    }

    public Claims getClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
