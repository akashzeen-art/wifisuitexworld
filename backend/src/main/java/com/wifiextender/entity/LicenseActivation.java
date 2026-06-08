package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "license_activations",
    indexes = {
        @Index(name = "idx_lic_act_license_id",  columnList = "license_id"),
        @Index(name = "idx_lic_act_machine_id",  columnList = "machine_id"),
        @Index(name = "idx_lic_act_created_at",  columnList = "created_at")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class LicenseActivation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_lic_act_license"))
    private License license;

    @Column(name = "machine_id", nullable = false, length = 64)
    private String machineId;

    @Column(name = "machine_label", length = 200)
    private String machineLabel;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Result result = Result.SUCCESS;

    @Column(name = "failure_reason", length = 300)
    private String failureReason;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); }

    public enum Result { SUCCESS, FAILED, REACTIVATED }
}
