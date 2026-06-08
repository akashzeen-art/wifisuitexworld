package com.wifiextender.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class AuthDto {

    // ── Requests ──────────────────────────────────────────────────────────────

    @Data
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        private String email;

        @Size(min = 6, message = "Password must be at least 6 characters")
        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class LoginRequest {
        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        private String email;

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    public static class RefreshRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    @Data
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType = "Bearer";
        private long expiresIn;       // access token TTL in seconds
        private UserInfo user;

        public AuthResponse(String accessToken, String refreshToken, long expiresIn, UserInfo user) {
            this.accessToken  = accessToken;
            this.refreshToken = refreshToken;
            this.expiresIn    = expiresIn;
            this.user         = user;
        }
    }

    @Data
    public static class UserInfo {
        private Long id;
        private String name;
        private String email;
        private String role;
        private boolean active;
        private java.time.LocalDateTime createdAt;
        private java.time.LocalDateTime lastLogin;

        public UserInfo(Long id, String name, String email, String role, boolean active) {
            this.id     = id;
            this.name   = name;
            this.email  = email;
            this.role   = role;
            this.active = active;
        }

        public UserInfo(Long id, String name, String email, String role, boolean active,
                        java.time.LocalDateTime createdAt, java.time.LocalDateTime lastLogin) {
            this(id, name, email, role, active);
            this.createdAt = createdAt;
            this.lastLogin = lastLogin;
        }
    }

    @Data
    public static class ErrorResponse {
        private int status;
        private String error;
        private String message;
        private long timestamp = System.currentTimeMillis();

        public ErrorResponse(int status, String error, String message) {
            this.status  = status;
            this.error   = error;
            this.message = message;
        }
    }
}
