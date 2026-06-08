package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "licenses",
    indexes = {
        @Index(name = "idx_licenses_user_id",         columnList = "user_id"),
        @Index(name = "idx_licenses_subscription_id", columnList = "subscription_id"),
        @Index(name = "idx_licenses_key",             columnList = "license_key", unique = true),
        @Index(name = "idx_licenses_status",          columnList = "status"),
        @Index(name = "idx_licenses_machine_id",      columnList = "machine_id")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class License {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_licenses_subscription"))
    private Subscription subscription;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_licenses_user"))
    private User user;

    @Column(name = "license_key", nullable = false, unique = true, length = 64)
    private String licenseKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ACTIVE;

    // ── Activation tracking ───────────────────────────────────────────────────

    /** SHA-256 of machine identifiers — bound on first activation */
    @Column(name = "machine_id", length = 64)
    private String machineId;

    /** Human-readable machine label (hostname + OS) */
    @Column(name = "machine_label", length = 200)
    private String machineLabel;

    @Column(name = "max_activations", nullable = false)
    private int maxActivations = 1;

    @Column(name = "activation_count", nullable = false)
    private int activationCount = 0;

    @Column(name = "activated_at")
    private LocalDateTime activatedAt;

    @Column(name = "last_checked_at")
    private LocalDateTime lastCheckedAt;

    // ── Expiry ────────────────────────────────────────────────────────────────

    /** NULL = lifetime license */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    // ── Revocation ────────────────────────────────────────────────────────────

    @Column(name = "revoked_reason", length = 500)
    private String revokedReason;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "revoked_by",
        foreignKey = @ForeignKey(name = "fk_licenses_revoked_by"))
    private User revokedBy;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    // ── Audit ─────────────────────────────────────────────────────────────────

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public boolean isExpired() {
        return expiresAt != null && expiresAt.isBefore(LocalDateTime.now());
    }

    public boolean isBoundToMachine() {
        return machineId != null && !machineId.isBlank();
    }

    public boolean matchesMachine(String incomingMachineId) {
        return machineId != null && machineId.equals(incomingMachineId);
    }

    public enum Status { ACTIVE, REVOKED, EXPIRED }
}
