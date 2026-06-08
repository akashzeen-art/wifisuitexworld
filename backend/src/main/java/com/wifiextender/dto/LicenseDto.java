package com.wifiextender.dto;

import com.wifiextender.entity.License;
import com.wifiextender.entity.LicenseActivation;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class LicenseDto {

    // ── Requests ──────────────────────────────────────────────────────────────

    @Data
    public static class ActivateRequest {
        @NotBlank(message = "License key is required")
        private String licenseKey;

        @NotBlank(message = "Machine ID is required")
        private String machineId;

        private String machineLabel;
        private String ipAddress;
    }

    @Data
    public static class ValidateRequest {
        @NotBlank(message = "License key is required")
        private String licenseKey;

        private String machineId;
    }

    @Data
    public static class RevokeRequest {
        private String reason;
    }

    // ── Responses ─────────────────────────────────────────────────────────────

    @Data
    public static class Response {
        private Long id;
        private Long subscriptionId;
        private Long userId;
        private String userName;
        private String userEmail;
        private String planName;
        private String licenseKey;
        private String status;
        private String machineId;
        private String machineLabel;
        private int maxActivations;
        private int activationCount;
        private boolean bound;
        private LocalDateTime activatedAt;
        private LocalDateTime lastCheckedAt;
        private LocalDateTime expiresAt;
        private LocalDateTime revokedAt;
        private String revokedReason;
        private String revokedByName;
        private LocalDateTime createdAt;
        private boolean expired;
        private boolean lifetime;

        public static Response from(License l) {
            Response r = new Response();
            r.id              = l.getId();
            r.subscriptionId  = l.getSubscription().getId();
            r.userId          = l.getUser().getId();
            r.userName        = l.getUser().getName();
            r.userEmail       = l.getUser().getEmail();
            r.planName        = l.getSubscription().getPlan() != null ? l.getSubscription().getPlan().getName() : null;
            r.licenseKey      = l.getLicenseKey();
            r.status          = l.getStatus().name();
            r.machineId       = l.getMachineId();
            r.machineLabel    = l.getMachineLabel();
            r.maxActivations  = l.getMaxActivations();
            r.activationCount = l.getActivationCount();
            r.bound           = l.isBoundToMachine();
            r.activatedAt     = l.getActivatedAt();
            r.lastCheckedAt   = l.getLastCheckedAt();
            r.expiresAt       = l.getExpiresAt();
            r.revokedAt       = l.getRevokedAt();
            r.revokedReason   = l.getRevokedReason();
            r.createdAt       = l.getCreatedAt();
            r.expired         = l.isExpired();
            r.lifetime        = l.getExpiresAt() == null;
            if (l.getRevokedBy() != null) r.revokedByName = l.getRevokedBy().getName();
            return r;
        }
    }

    @Data
    public static class ActivationRecord {
        private Long id;
        private String machineId;
        private String machineLabel;
        private String ipAddress;
        private String result;
        private String failureReason;
        private LocalDateTime createdAt;

        public static ActivationRecord from(LicenseActivation a) {
            ActivationRecord r = new ActivationRecord();
            r.id            = a.getId();
            r.machineId     = a.getMachineId();
            r.machineLabel  = a.getMachineLabel();
            r.ipAddress     = a.getIpAddress();
            r.result        = a.getResult().name();
            r.failureReason = a.getFailureReason();
            r.createdAt     = a.getCreatedAt();
            return r;
        }
    }

    @Data
    public static class ActivateResponse {
        private boolean success;
        private String message;
        private Response license;
        private String planName;
        private Integer maxDevices;
        private boolean unlimitedDevices;
        private LocalDateTime expiresAt;
        private boolean lifetime;
    }
}
