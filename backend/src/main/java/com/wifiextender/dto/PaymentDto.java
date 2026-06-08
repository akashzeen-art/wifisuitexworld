package com.wifiextender.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDto {

    // ── Create order (frontend calls this first) ──────────────────────────────
    @Data
    public static class CreateOrderRequest {
        @NotNull
        private Long planId;

        @NotBlank
        private String gateway;   // STRIPE | RAZORPAY | PAYPAL

        private String currency;  // USD, INR, EUR — defaults to plan currency
    }

    @Data
    public static class CreateOrderResponse {
        private String  gateway;
        private String  orderId;          // Razorpay order id / PayPal order id
        private String  clientSecret;     // Stripe payment intent client secret
        private String  approvalUrl;      // PayPal approval redirect URL
        private String  razorpayKeyId;    // Razorpay public key id
        private BigDecimal amount;
        private String  currency;
        private Long    paymentId;        // our DB payment record id
    }

    // ── Verify payment (frontend calls after gateway confirms) ────────────────
    @Data
    public static class VerifyRequest {
        @NotNull
        private Long paymentId;

        @NotBlank
        private String gateway;

        // Stripe
        private String stripePaymentIntentId;

        // Razorpay
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;

        // PayPal
        private String paypalOrderId;
    }

    // ── Stripe webhook ────────────────────────────────────────────────────────
    @Data
    public static class StripeWebhookRequest {
        private String payload;
        private String sigHeader;
    }

    // ── Response ──────────────────────────────────────────────────────────────
    @Data
    public static class Response {
        private Long          id;
        private Long          userId;
        private String        userName;
        private Long          subscriptionId;
        private String        planName;
        private BigDecimal    amount;
        private String        currency;
        private String        status;
        private String        gateway;
        private String        gatewayTxnId;
        private String        gatewayOrderId;
        private String        description;
        private LocalDateTime paidAt;
        private LocalDateTime createdAt;
        private LocalDateTime refundedAt;

        public static Response from(com.wifiextender.entity.Payment p) {
            Response r = new Response();
            r.id             = p.getId();
            r.userId         = p.getUser().getId();
            r.userName       = p.getUser().getName();
            r.subscriptionId = p.getSubscription() != null ? p.getSubscription().getId() : null;
            r.planName       = p.getSubscription() != null && p.getSubscription().getPlan() != null
                               ? p.getSubscription().getPlan().getName() : null;
            r.amount         = p.getAmount();
            r.currency       = p.getCurrency();
            r.status         = p.getStatus().name();
            r.gateway        = p.getGateway();
            r.gatewayTxnId   = p.getGatewayTxnId();
            r.gatewayOrderId = p.getGatewayOrderId();
            r.description    = p.getDescription();
            r.paidAt         = p.getPaidAt();
            r.createdAt      = p.getCreatedAt();
            r.refundedAt     = p.getRefundedAt();
            return r;
        }
    }
}
