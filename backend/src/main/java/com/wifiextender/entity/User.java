package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "users",
    indexes = {
        @Index(name = "idx_users_email",     columnList = "email",     unique = true),
        @Index(name = "idx_users_role",      columnList = "role"),
        @Index(name = "idx_users_is_active", columnList = "is_active")
    }
)
@Getter @Setter @NoArgsConstructor @ToString(exclude = {"password"})
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(unique = true, nullable = false, length = 255)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.USER;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "failed_attempts", nullable = false, columnDefinition = "SMALLINT")
    private int failedAttempts = 0;

    @Column(name = "locked_until")
    private LocalDateTime lockedUntil;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "notify_device_connect", nullable = false)
    private boolean notifyDeviceConnect = true;

    @Column(name = "notify_device_block", nullable = false)
    private boolean notifyDeviceBlock = true;

    @Column(name = "notify_license_expiry", nullable = false)
    private boolean notifyLicenseExpiry = true;

    @Column(name = "notify_newsletter", nullable = false)
    private boolean notifyNewsletter = false;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public boolean isLocked() {
        return lockedUntil != null && lockedUntil.isAfter(LocalDateTime.now());
    }

    public enum Role { ADMIN, USER }
}
