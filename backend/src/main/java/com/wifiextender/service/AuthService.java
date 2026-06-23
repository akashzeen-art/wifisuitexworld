package com.wifiextender.service;

import com.wifiextender.dto.AuthDto;
import com.wifiextender.entity.RefreshToken;
import com.wifiextender.entity.User;
import com.wifiextender.repository.RefreshTokenRepository;
import com.wifiextender.repository.UserRepository;
import com.wifiextender.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final int LOCK_DURATION_MINUTES = 15;

    private final UserRepository        userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder       passwordEncoder;
    private final JwtUtil               jwtUtil;
    private final UserService           userService;

    // ── Register ──────────────────────────────────────────────────────────────
    @Transactional
    public AuthDto.AuthResponse register(AuthDto.RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new IllegalArgumentException("Email is already registered");
        }
        User user = new User();
        user.setName(req.getName().trim());
        user.setEmail(req.getEmail().toLowerCase().trim());
        user.setPassword(passwordEncoder.encode(req.getPassword()));
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    @Transactional
    public AuthDto.AuthResponse login(AuthDto.LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));

        if (!user.isActive()) {
            throw new IllegalStateException("Account is disabled. Contact support.");
        }
        if (user.isLocked()) {
            throw new IllegalStateException("Account is temporarily locked. Try again in " + LOCK_DURATION_MINUTES + " minutes.");
        }
        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            handleFailedAttempt(user);
            throw new IllegalArgumentException("Invalid email or password");
        }

        // Reset failed attempts on success
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);

        return buildAuthResponse(user);
    }

    // ── Refresh ───────────────────────────────────────────────────────────────
    @Transactional
    public AuthDto.AuthResponse refresh(String rawRefreshToken) {
        if (!jwtUtil.validateRefreshToken(rawRefreshToken)) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String hash = sha256(rawRefreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> new IllegalArgumentException("Refresh token not found"));

        if (stored.isRevoked() || stored.isExpired()) {
            throw new IllegalArgumentException("Refresh token has been revoked or expired");
        }

        // Rotate: revoke old, issue new
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);

        User user = stored.getUser();
        return buildAuthResponse(user);
    }

    // ── Logout ────────────────────────────────────────────────────────────────
    @Transactional
    public void logout(Long userId) {
        refreshTokenRepository.revokeAllByUserId(userId);
    }

    // ── Me ────────────────────────────────────────────────────────────────────
    public AuthDto.UserInfo me(User user) {
        return userService.toUserInfo(user);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private AuthDto.AuthResponse buildAuthResponse(User user) {
        String accessToken  = jwtUtil.generateAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        // Persist hashed refresh token
        RefreshToken rt = new RefreshToken();
        rt.setUser(user);
        rt.setTokenHash(sha256(refreshToken));
        rt.setExpiresAt(LocalDateTime.now().plusSeconds(jwtUtil.getRefreshExpirationMs() / 1000));
        refreshTokenRepository.save(rt);

        AuthDto.UserInfo userInfo = userService.toUserInfo(user);
        return new AuthDto.AuthResponse(accessToken, refreshToken, 900, userInfo);
    }

    private void handleFailedAttempt(User user) {
        int attempts = user.getFailedAttempts() + 1;
        user.setFailedAttempts(attempts);
        if (attempts >= MAX_FAILED_ATTEMPTS) {
            user.setLockedUntil(LocalDateTime.now().plusMinutes(LOCK_DURATION_MINUTES));
        }
        userRepository.save(user);
    }

    private String sha256(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException("Hashing failed", e);
        }
    }
}
