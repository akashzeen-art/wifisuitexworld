package com.wifiextender.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
    name = "payments",
    indexes = {
        @Index(name = "idx_payments_user_id",         columnList = "user_id"),
        @Index(name = "idx_payments_subscription_id", columnList = "subscription_id"),
        @Index(name = "idx_payments_status",          columnList = "status"),
        @Index(name = "idx_payments_gateway_txn_id",  columnList = "gateway_txn_id")
    }
)
@Getter @Setter @NoArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false,
        foreignKey = @ForeignKey(name = "fk_payments_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "subscription_id",
        foreignKey = @ForeignKey(name = "fk_payments_subscription"))
    private Subscription subscription;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(nullable = false, length = 3)
    private String currency = "USD";

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.PENDING;

    /** STRIPE | RAZORPAY | PAYPAL | MANUAL */
    @Column(length = 50)
    private String gateway;

    /** Stripe PaymentIntent ID / Razorpay payment_id / PayPal capture ID */
    @Column(name = "gateway_txn_id", length = 255)
    private String gatewayTxnId;

    /** Razorpay order_id / PayPal order ID / Stripe PaymentIntent ID (duplicate for search) */
    @Column(name = "gateway_order_id", length = 255)
    private String gatewayOrderId;

    /** Razorpay signature for verification */
    @Column(name = "gateway_signature", length = 512)
    private String gatewaySignature;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "refund_id", length = 255)
    private String refundId;

    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @Column(name = "refunded_at")
    private LocalDateTime refundedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    void prePersist() { createdAt = LocalDateTime.now(); updatedAt = LocalDateTime.now(); }

    @PreUpdate
    void preUpdate() { updatedAt = LocalDateTime.now(); }

    public enum Status { PENDING, SUCCESS, FAILED, REFUNDED }
}
