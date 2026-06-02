package com.garrage.security;

import java.io.IOException;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import com.garrage.model.Garage;
import com.garrage.repository.GarageRepository;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;
    private final GarageRepository garageRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String token = extractTokenFromRequest(request);

            if (StringUtils.hasText(token) && jwtTokenProvider.validateToken(token)) {
                Claims claims = jwtTokenProvider.getClaimsFromToken(token);

                String userId = claims.getSubject();
                String role = claims.get("role", String.class);
                String garageId = claims.get("garageId", String.class);
                String garageName = claims.get("garageName", String.class);
                String phone = claims.get("phone", String.class);

                // Extract permissions from JWT (only present for garage_staff)
                @SuppressWarnings("unchecked")
                List<String> permissions = claims.get("permissions", List.class);

                UserPrincipal userPrincipal = UserPrincipal.builder()
                        .id(userId)
                        .phone(phone)
                        .role(role != null ? role : "")
                        .garageId(garageId)
                        .garageName(garageName)
                        .permissions(permissions)
                        .build();

                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userPrincipal,
                                null,
                                userPrincipal.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authentication);

                TenantContext.setGarageId(garageId);

                // Block API access for inactive garages (garage_admin and garage_staff only)
                if (("garage_admin".equals(role) || "garage_staff".equals(role))
                        && garageId != null && !garageId.isBlank()) {
                    boolean garageActive = garageRepository.findById(garageId)
                            .map(Garage::isActive)
                            .orElse(false);
                    if (!garageActive) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                        response.getWriter().write(
                                "{\"error\":\"GARAGE_INACTIVE\",\"message\":\"Your garage account has been suspended\"}");
                        return;
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Could not set user authentication in security context", e);
        }

        try {
            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private String extractTokenFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }
}
