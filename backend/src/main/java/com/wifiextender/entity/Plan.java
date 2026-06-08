package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(
    name = "plans",
    indexes = {
        @Index(name = "idx_plans_is_active",  columnList = "is_active"),
        @Index(name = "idx_plans_plan_type",  columnList = "plan_type"),
        @Index(name = "uq_plans_name",        columnList = "name", unique = true)
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Plan {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Enumerated(EnumType.STRING)
    @Column(name = "plan_type", nullable = false, length = 20)
    private PlanType planType = PlanType.MONTHLY;

    /** Duration in days. NULL = lifetime (never expires). */
    @Column(name = "duration_days")
    private Integer durationDays;

    /** Free trial days. 0 = no trial. */
    @Column(name = "trial_days", nullable = false)
    private Integer trialDays = 0;

    /** -1 = unlimited */
    @Column(name = "max_devices", nullable = false)
    private Integer maxDevices = 5;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    @Column(name = "is_popular", nullable = false)
    private boolean popular = false;

    /** Comma-separated feature list stored as text */
    @Column(name = "features", columnDefinition = "TEXT")
    private String features;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    public boolean isLifetime() { return planType == PlanType.LIFETIME; }
    public boolean isFreeTrial() { return planType == PlanType.FREE_TRIAL; }
    public boolean hasUnlimitedDevices() { return maxDevices != null && maxDevices == -1; }

    public enum PlanType { MONTHLY, LIFETIME, FREE_TRIAL }
}
