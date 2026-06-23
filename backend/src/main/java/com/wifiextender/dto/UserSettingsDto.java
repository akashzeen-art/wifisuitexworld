package com.wifiextender.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

public class UserSettingsDto {

    @Data
    public static class UpdateProfileRequest {
        @NotBlank(message = "Name is required")
        private String name;

        @Email(message = "Invalid email address")
        @NotBlank(message = "Email is required")
        private String email;
    }

    @Data
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @Size(min = 6, message = "Password must be at least 6 characters")
        @NotBlank(message = "New password is required")
        private String newPassword;

        @NotBlank(message = "Please confirm your password")
        private String confirmPassword;
    }

    @Data
    public static class NotificationSettings {
        private boolean deviceConnect = true;
        private boolean deviceBlock = true;
        private boolean licenseExpiry = true;
        private boolean newsletter = false;
    }

    @Data
    public static class DeleteAccountRequest {
        @NotBlank(message = "Password is required to delete your account")
        private String password;
    }
}
