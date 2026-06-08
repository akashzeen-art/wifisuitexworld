package com.wifiextender.controller;

import com.wifiextender.dto.PaymentDto;
import com.wifiextender.entity.User;
import com.wifiextender.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Payments", description = "Stripe, Razorpay and PayPal payment processing")
@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "Create a payment order — returns gateway-specific data to frontend")
    @PostMapping("/create-order")
    public ResponseEntity<PaymentDto.CreateOrderResponse> createOrder(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PaymentDto.CreateOrderRequest req) {
        return ResponseEntity.ok(paymentService.createOrder(user, req));
    }

    @Operation(summary = "Verify payment after gateway confirmation")
    @PostMapping("/verify")
    public ResponseEntity<PaymentDto.Response> verify(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PaymentDto.VerifyRequest req) {
        return ResponseEntity.ok(paymentService.verifyPayment(user, req));
    }

    @Operation(summary = "Stripe webhook — called by Stripe servers")
    @PostMapping("/webhook/stripe")
    public ResponseEntity<Void> stripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader) {
        paymentService.handleStripeWebhook(payload, sigHeader);
        return ResponseEntity.ok().build();
    }

    @Operation(summary = "Get my payment history")
    @GetMapping
    public ResponseEntity<List<PaymentDto.Response>> myPayments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(paymentService.getUserPayments(user.getId()));
    }

    @Operation(summary = "Admin: get all payments")
    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<PaymentDto.Response>> adminPayments() {
        return ResponseEntity.ok(paymentService.adminGetAll());
    }
}
