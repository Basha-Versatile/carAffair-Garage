package com.garrage.service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.garrage.config.OtpProperties;
import com.garrage.dto.request.RefreshTokenRequest;
import com.garrage.dto.request.SendOtpRequest;
import com.garrage.dto.request.VerifyOtpRequest;
import com.garrage.dto.response.AuthResponse;
import com.garrage.exception.BadRequestException;
import com.garrage.exception.UnauthorizedException;
import com.garrage.model.GarageRole;
import com.garrage.model.OtpLog;
import com.garrage.model.User;
import com.garrage.repository.GarageRoleRepository;
import com.garrage.repository.OtpLogRepository;
import com.garrage.repository.UserRepository;
import com.garrage.security.JwtTokenProvider;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final GarageRoleRepository garageRoleRepository;
    private final OtpLogRepository otpLogRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final OtpProperties otpProperties;

    private static final String MOCK_OTP = "123456";

    /**
     * Sends an OTP to the given phone number.
     * In mock mode, always uses "123456" and logs it instead of sending SMS.
     */
    public String sendOtp(SendOtpRequest request) {
        String phone = request.getPhone();
        String role = request.getRole();

        // Generate 6-digit OTP (or use fixed value in mock mode)
        String otp = otpProperties.isMock() ? MOCK_OTP : generateOtp();

        // Delete old unverified OTPs for this phone
        otpLogRepository.deleteByPhoneAndVerifiedFalse(phone);

        // Save new OTP log with expiry
        OtpLog otpLog = OtpLog.builder()
                .phone(phone)
                .otp(otp)
                .role(role)
                .verified(false)
                .expiresAt(LocalDateTime.now().plusSeconds(otpProperties.getExpirySeconds()))
                .build();
        otpLogRepository.save(otpLog);

        // In production, send SMS here. For now, just log it.
        log.info("OTP for phone {} (role: {}): {}", phone, role, otp);

        // Return OTP in dev/mock mode for testing convenience
        if (otpProperties.isMock()) {
            return otp;
        }
        return null;
    }

    /**
     * Verifies the OTP and returns auth tokens.
     * Creates a new customer user if one doesn't exist, but
     * requires pre-existing accounts for garage_admin and vendor roles.
     */
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        String phone = request.getPhone();
        String otp = request.getOtp();
        String role = request.getRole();

        // Find latest unverified OTP for this phone
        OtpLog otpLog = otpLogRepository
                .findTopByPhoneAndVerifiedFalseOrderByCreatedAtDesc(phone)
                .orElseThrow(() -> new UnauthorizedException("Invalid or expired OTP"));

        // Check if expired
        if (otpLog.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        // Validate OTP: in mock mode accept "123456" always, otherwise must match exactly
        boolean otpValid = otpProperties.isMock()
                ? MOCK_OTP.equals(otp)
                : otpLog.getOtp().equals(otp);

        if (!otpValid) {
            throw new UnauthorizedException("Invalid or expired OTP");
        }

        // Mark OTP as verified
        otpLog.setVerified(true);
        otpLogRepository.save(otpLog);

        // Find or create user based on role
        User user = findOrCreateUser(phone, role);

        // Resolve permissions and financial modules for garage_staff
        GarageRole garageRole = resolveGarageRole(user);
        List<String> permissions = garageRole != null ? garageRole.getPermissions() : null;
        List<String> financialModules = garageRole != null ? garageRole.getFinancialModules() : null;

        // Generate tokens (permissions + financialModules embedded in JWT for garage_staff)
        String accessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getRole(), user.getGarageId(), user.getGarageName(),
                user.getPhone(), permissions, financialModules);
        String refreshToken = jwtTokenProvider.generateRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole())
                .garageId(user.getGarageId())
                .garageName(user.getGarageName())
                .permissions(permissions)
                .financialModules(financialModules)
                .garageRoleId(user.getGarageRoleId())
                .staffTitle(user.getStaffTitle())
                .build();
    }

    /**
     * Refreshes the access token using a valid refresh token.
     */
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        // Validate refresh token
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        // Extract userId
        String userId = jwtTokenProvider.getUserIdFromToken(refreshToken);

        // Find user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // Resolve permissions and financial modules (fresh from DB on refresh)
        GarageRole garageRole = resolveGarageRole(user);
        List<String> permissions = garageRole != null ? garageRole.getPermissions() : null;
        List<String> financialModules = garageRole != null ? garageRole.getFinancialModules() : null;

        // Generate new access token
        String newAccessToken = jwtTokenProvider.generateAccessToken(
                user.getId(), user.getRole(), user.getGarageId(), user.getGarageName(),
                user.getPhone(), permissions, financialModules);

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken) // keep same refresh token
                .userId(user.getId())
                .name(user.getName())
                .phone(user.getPhone())
                .role(user.getRole())
                .garageId(user.getGarageId())
                .garageName(user.getGarageName())
                .permissions(permissions)
                .financialModules(financialModules)
                .garageRoleId(user.getGarageRoleId())
                .staffTitle(user.getStaffTitle())
                .build();
    }

    // ---- Private helpers ----

    private User findOrCreateUser(String phone, String role) {
        switch (role) {
            case "garage_admin":
                // Try garage_admin first, then super_admin, then garage_staff
                // (all admin roles login from the same admin panel)
                return userRepository.findFirstByPhoneAndRole(phone, "garage_admin")
                        .or(() -> userRepository.findFirstByPhoneAndRole(phone, "super_admin"))
                        .or(() -> userRepository.findFirstByPhoneAndRole(phone, "garage_staff"))
                        .orElseThrow(() -> new BadRequestException(
                                "No admin account found for this number"));

            case "super_admin":
                return userRepository.findFirstByPhoneAndRole(phone, "super_admin")
                        .or(() -> userRepository.findFirstByPhoneAndRole(phone, "garage_admin"))
                        .or(() -> userRepository.findFirstByPhoneAndRole(phone, "garage_staff"))
                        .orElseThrow(() -> new BadRequestException(
                                "No admin account found for this number"));

            case "vendor":
                return userRepository.findFirstByPhoneAndRole(phone, "vendor")
                        .orElseThrow(() -> new BadRequestException(
                                "No vendor account found"));

            case "customer":
                return userRepository.findFirstByPhoneAndRole(phone, "customer")
                        .orElseGet(() -> {
                            User newUser = User.builder()
                                    .phone(phone)
                                    .role("customer")
                                    .isActive(true)
                                    .build();
                            return userRepository.save(newUser);
                        });

            default:
                throw new BadRequestException("Invalid role: " + role);
        }
    }

    /**
     * Resolves the GarageRole for garage_staff users.
     * Returns null for non-staff roles (super_admin, garage_admin, customer, vendor).
     */
    private GarageRole resolveGarageRole(User user) {
        if (!"garage_staff".equals(user.getRole()) || user.getGarageRoleId() == null) {
            return null;
        }
        return garageRoleRepository.findByIdAndGarageId(user.getGarageRoleId(), user.getGarageId())
                .orElse(null);
    }

    private String generateOtp() {
        Random random = new Random();
        int otpNum = 100000 + random.nextInt(900000);
        return String.valueOf(otpNum);
    }
}
