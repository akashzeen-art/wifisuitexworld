package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "refresh_tokens",
    indexes = {
        @Index(name = "idx_refresh_tokens_user_id",    columnList = "user_id"),
        @Index(name = "idx_refresh_tokens_hash",       columnList = "token_hash", unique = true),
        @Index(name = "idx_refresh_tokens_expires_at", columnList = "expires_at")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @Column(name = "token_hash", nullable = false, unique = true, length = 64)
    private String tokenHash;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_refresh_tokens_user"))
    private User user;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    @Column(name = "revoked", nullable = false)
    private boolean revoked = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); }

    public boolean isExpired() {
        return expiresAt.isBefore(LocalDateTime.now());
    }
}
