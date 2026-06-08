package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "bandwidth_usage",
    indexes = {
        @Index(name = "idx_bandwidth_user_id",     columnList = "user_id"),
        @Index(name = "idx_bandwidth_hotspot_id",  columnList = "hotspot_id"),
        @Index(name = "idx_bandwidth_device_id",   columnList = "device_id"),
        @Index(name = "idx_bandwidth_recorded_at", columnList = "recorded_at"),
        @Index(name = "idx_bandwidth_user_time",   columnList = "user_id,recorded_at")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class BandwidthUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_bandwidth_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotspot_id",
        foreignKey = @ForeignKey(name = "fk_bandwidth_hotspot"))
    private Hotspot hotspot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id",
        foreignKey = @ForeignKey(name = "fk_bandwidth_device"))
    private ConnectedDevice device;

    @Column(name = "bytes_up", nullable = false)
    private Long bytesUp = 0L;

    @Column(name = "bytes_down", nullable = false)
    private Long bytesDown = 0L;

    @Column(name = "recorded_at", nullable = false)
    private LocalDateTime recordedAt;

    @PrePersist
    void prePersist() {
        if (recordedAt == null) recordedAt = LocalDateTime.now();
    }
}
