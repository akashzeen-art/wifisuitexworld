package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "connected_devices",
    indexes = {
        @Index(name = "idx_connected_devices_user_id",    columnList = "user_id"),
        @Index(name = "idx_connected_devices_hotspot_id", columnList = "hotspot_id"),
        @Index(name = "idx_connected_devices_mac",        columnList = "user_id,mac_address"),
        @Index(name = "idx_connected_devices_blocked",    columnList = "user_id,is_blocked"),
        @Index(name = "idx_connected_devices_online",     columnList = "user_id,is_online"),
        @Index(name = "idx_connected_devices_last_seen",  columnList = "last_seen")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ConnectedDevice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_connected_devices_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hotspot_id",
        foreignKey = @ForeignKey(name = "fk_connected_devices_hotspot"))
    private Hotspot hotspot;

    @Column(name = "mac_address", nullable = false, length = 17)
    private String macAddress;

    @Column(name = "device_name", length = 100)
    private String deviceName;

    @Enumerated(EnumType.STRING)
    @Column(name = "device_type", length = 30)
    private DeviceType deviceType = DeviceType.UNKNOWN;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    /** Hardware vendor derived from MAC OUI lookup */
    @Column(name = "vendor", length = 100)
    private String vendor;

    /** Signal strength 0-100 (reported by desktop app) */
    @Column(name = "signal_strength")
    private Integer signalStrength;

    @Column(name = "is_blocked", nullable = false)
    private boolean blocked = false;

    /** True if device sent a heartbeat within the last 2 minutes */
    @Column(name = "is_online", nullable = false)
    private boolean online = true;

    @Column(name = "bytes_sent", nullable = false)
    private Long bytesSent = 0L;

    @Column(name = "bytes_received", nullable = false)
    private Long bytesReceived = 0L;

    @Column(name = "last_seen", nullable = false)
    private LocalDateTime lastSeen;

    @Column(name = "connected_at", nullable = false)
    private LocalDateTime connectedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() {
        LocalDateTime now = LocalDateTime.now();
        if (lastSeen    == null) lastSeen    = now;
        if (connectedAt == null) connectedAt = now;
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    public enum DeviceType { PHONE, LAPTOP, TABLET, TV, DESKTOP, UNKNOWN }
}
