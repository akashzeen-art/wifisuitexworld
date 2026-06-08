package com.wifiextender.dto;

import com.wifiextender.entity.Subscription;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class SubscriptionDto {

    // ── Admin requests ────────────────────────────────────────────────────────

    @Data
    public static class AssignRequest {
        @NotNull(message = "User ID is required")
        private Long userId;

        @NotNull(message = "Plan ID is required")
        private Long planId;

        /** Override duration in days. NULL = use plan default. */
        private Integer durationDays;

        private String notes;
    }

    @Data
    public static class ExtendRequest {
        @NotNull(message = "Days to extend is required")
        @Min(value = 1, message = "Must extend by at least 1 day")
        private Integer days;

        private String notes;
    }

    @Data
    public static class DisableRequest {
        private String reason;
    }

    // ── Response ──────────────────────────────────────────────────────────────

    @Data
    public static class Response {
        private Long id;
        private Long userId;
        private String userName;
        private String userEmail;
        private PlanSummary plan;
        private String status;
        private boolean active;
        private boolean expired;
        private boolean inTrial;
        private boolean lifetime;
        private LocalDateTime startsAt;
        private LocalDateTime expiresAt;
        private LocalDateTime trialEndsAt;
        private LocalDateTime cancelledAt;
        private LocalDateTime activatedAt;
        private String activatedByName;
        private String adminNotes;
        private LocalDateTime createdAt;
        private int maxDevices;

        @Data
        public static class PlanSummary {
            private Long id;
            private String name;
            private String planType;
            private BigDecimal price;
            private Integer maxDevices;
            private boolean unlimitedDevices;
        }

        public static Response from(Subscription s) {
            Response r = new Response();
            r.id           = s.getId();
            r.userId       = s.getUser().getId();
            r.userName     = s.getUser().getName();
            r.userEmail    = s.getUser().getEmail();
            r.status       = s.getStatus().name();
            r.active       = s.isActive();
            r.expired      = s.isExpired();
            r.inTrial      = s.isInTrial();
            r.startsAt     = s.getStartsAt();
            r.expiresAt    = s.getExpiresAt();
            r.trialEndsAt  = s.getTrialEndsAt();
            r.cancelledAt  = s.getCancelledAt();
            r.activatedAt  = s.getActivatedAt();
            r.adminNotes   = s.getAdminNotes();
            r.createdAt    = s.getCreatedAt();
            r.maxDevices   = s.getMaxDevices();
            r.lifetime     = s.getPlan() != null && s.getPlan().isLifetime();

            if (s.getActivatedBy() != null)
                r.activatedByName = s.getActivatedBy().getName();

            if (s.getPlan() != null) {
                PlanSummary ps = new PlanSummary();
                ps.id               = s.getPlan().getId();
                ps.name             = s.getPlan().getName();
                ps.planType         = s.getPlan().getPlanType().name();
                ps.price            = s.getPlan().getPrice();
                ps.maxDevices       = s.getPlan().getMaxDevices();
                ps.unlimitedDevices = s.getPlan().hasUnlimitedDevices();
                r.plan = ps;
            }
            return r;
        }
    }
}
