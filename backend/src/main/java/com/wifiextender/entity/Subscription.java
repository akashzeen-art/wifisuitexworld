package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "subscriptions",
    indexes = {
        @Index(name = "idx_subscriptions_user_id",    columnList = "user_id"),
        @Index(name = "idx_subscriptions_plan_id",    columnList = "plan_id"),
        @Index(name = "idx_subscriptions_status",     columnList = "status"),
        @Index(name = "idx_subscriptions_expires_at", columnList = "expires_at")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_subscriptions_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "plan_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_subscriptions_plan"))
    private Plan plan;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    /** NULL = lifetime subscription */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "trial_ends_at")
    private LocalDateTime trialEndsAt;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    /** Admin who activated this subscription */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activated_by",
        foreignKey = @ForeignKey(name = "fk_subscriptions_activated_by"))
    private User activatedBy;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    public boolean isExpired() {
        if (plan != null && plan.isLifetime()) return false;
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isActive() { return status == Status.ACTIVE && !isExpired(); }

    public boolean isInTrial() {
        return trialEndsAt != null && trialEndsAt.isAfter(LocalDateTime.now());
    }

    public int getMaxDevices() {
        return plan != null ? plan.getMaxDevices() : 0;
    }

    public enum Status { PENDING, ACTIVE, EXPIRED, CANCELLED, DISABLED }
}
