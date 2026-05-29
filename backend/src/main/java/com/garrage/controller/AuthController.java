package com.garrage.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.garrage.dto.request.RefreshTokenRequest;
import com.garrage.dto.request.SendOtpRequest;
import com.garrage.dto.request.VerifyOtpRequest;
import com.garrage.dto.response.ApiResponse;
import com.garrage.dto.response.AuthResponse;
import com.garrage.service.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    /**
     * POST /api/auth/send-otp
     * Sends an OTP to the given phone number.
     */
    @PostMapping("/send-otp")
    public ResponseEntity<ApiResponse<String>> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String otp = authService.sendOtp(request);
        ApiResponse<String> response = ApiResponse.okMessage("OTP sent successfully");
        response.setData(otp); // non-null only in mock/dev mode
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/auth/verify-otp
     * Verifies the OTP and returns auth tokens.
     */
    @PostMapping("/verify-otp")
    public ResponseEntity<ApiResponse<AuthResponse>> verifyOtp(
            @Valid @RequestBody VerifyOtpRequest request) {
        AuthResponse authResponse = authService.verifyOtp(request);
        return ResponseEntity.ok(ApiResponse.ok(authResponse));
    }

    /**
     * POST /api/auth/refresh
     * Refreshes the access token using a valid refresh token.
     */
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refreshToken(
            @Valid @RequestBody RefreshTokenRequest request) {
        AuthResponse authResponse = authService.refreshToken(request);
        return ResponseEntity.ok(ApiResponse.ok(authResponse));
    }
}
