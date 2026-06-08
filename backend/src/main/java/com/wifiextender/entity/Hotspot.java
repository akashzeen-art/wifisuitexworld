package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "hotspots",
    indexes = {
        @Index(name = "idx_hotspots_user_id",    columnList = "user_id"),
        @Index(name = "idx_hotspots_status",     columnList = "status"),
        @Index(name = "idx_hotspots_license_id", columnList = "license_id")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Hotspot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_hotspots_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "license_id",
        foreignKey = @ForeignKey(name = "fk_hotspots_license"))
    private License license;

    @Column(nullable = false, length = 32)
    private String ssid;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.STOPPED;

    @Column(name = "max_clients", nullable = false)
    private Integer maxClients = 10;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "stopped_at")
    private LocalDateTime stoppedAt;

    @Column(name = "total_bytes_up", nullable = false)
    private Long totalBytesUp = 0L;

    @Column(name = "total_bytes_down", nullable = false)
    private Long totalBytesDown = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Status { ACTIVE, STOPPED, ERROR }
}
