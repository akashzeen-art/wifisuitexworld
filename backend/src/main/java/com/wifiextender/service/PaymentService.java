package com.wifiextender.service;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Event;
import com.stripe.net.Webhook;
import com.stripe.param.PaymentIntentCreateParams;
import com.wifiextender.dto.PaymentDto;
import com.wifiextender.entity.*;
import com.wifiextender.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.hc.client5.http.classic.methods.HttpPost;
import org.apache.hc.client5.http.impl.classic.CloseableHttpClient;
import org.apache.hc.client5.http.impl.classic.HttpClients;
import org.apache.hc.core5.http.io.entity.StringEntity;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository      paymentRepository;
    private final PlanRepository         planRepository;
    private final UserRepository         userRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository      licenseRepository;

    @Value("${app.payment.stripe.secret-key:}")
    private String stripeSecretKey;

    @Value("${app.payment.stripe.webhook-secret:}")
    private String stripeWebhookSecret;

    @Value("${app.payment.stripe.publishable-key:}")
    private String stripePublishableKey;

    @Value("${app.payment.razorpay.key-id:}")
    private String razorpayKeyId;

    @Value("${app.payment.razorpay.key-secret:}")
    private String razorpayKeySecret;

    @Value("${app.payment.paypal.client-id:}")
    private String paypalClientId;

    @Value("${app.payment.paypal.client-secret:}")
    private String paypalClientSecret;

    @Value("${app.payment.paypal.mode:sandbox}")
    private String paypalMode;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;

    // ── Create order ──────────────────────────────────────────────────────────
    @Transactional
    public PaymentDto.CreateOrderResponse createOrder(User user, PaymentDto.CreateOrderRequest req) {
        Plan plan = planRepository.findById(req.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        if (!plan.isActive())
            throw new IllegalStateException("Plan is not available");

        String currency = req.getCurrency() != null ? req.getCurrency().toUpperCase() : "USD";

        Payment payment = new Payment();
        payment.setUser(user);
        payment.setAmount(plan.getPrice());
        payment.setCurrency(currency);
        payment.setGateway(req.getGateway().toUpperCase());
        payment.setStatus(Payment.Status.PENDING);
        payment.setDescription("Subscription: " + plan.getName());
        // Store planId in gatewayOrderId temporarily for lookup after payment
        payment.setGatewayOrderId("plan_" + plan.getId());
        paymentRepository.save(payment);

        return switch (req.getGateway().toUpperCase()) {
            case "STRIPE"   -> createStripeOrder(payment, plan, plan.getPrice(), currency);
            case "RAZORPAY" -> createRazorpayOrder(payment, plan, plan.getPrice(), currency);
            case "PAYPAL"   -> createPaypalOrder(payment, plan, plan.getPrice(), currency);
            default -> throw new IllegalArgumentException("Unsupported gateway: " + req.getGateway());
        };
    }

    // ── Verify payment ────────────────────────────────────────────────────────
    @Transactional
    public PaymentDto.Response verifyPayment(User user, PaymentDto.VerifyRequest req) {
        Payment payment = paymentRepository.findById(req.getPaymentId())
                .orElseThrow(() -> new IllegalArgumentException("Payment not found"));
        if (!payment.getUser().getId().equals(user.getId()))
            throw new IllegalStateException("Access denied");

        return switch (req.getGateway().toUpperCase()) {
            case "STRIPE"   -> verifyStripe(payment, req);
            case "RAZORPAY" -> verifyRazorpay(payment, req);
            case "PAYPAL"   -> verifyPaypal(payment, req);
            default -> throw new IllegalArgumentException("Unsupported gateway");
        };
    }

    // ── Stripe webhook ────────────────────────────────────────────────────────
    @Transactional
    public void handleStripeWebhook(String payload, String sigHeader) {
        try {
            Event event = Webhook.constructEvent(payload, sigHeader, stripeWebhookSecret);
            if ("payment_intent.succeeded".equals(event.getType())) {
                PaymentIntent pi = (PaymentIntent) event.getDataObjectDeserializer()
                        .getObject().orElseThrow();
                paymentRepository.findByGatewayTxnId(pi.getId()).ifPresent(p -> {
                    if (p.getStatus() != Payment.Status.SUCCESS) {
                        p.setStatus(Payment.Status.SUCCESS);
                        p.setPaidAt(LocalDateTime.now());
                        paymentRepository.save(p);
                        activateSubscriptionForPayment(p);
                    }
                });
            }
        } catch (Exception e) {
            log.error("Stripe webhook error: {}", e.getMessage());
            throw new IllegalStateException("Webhook verification failed");
        }
    }

    // ── User: my payments ─────────────────────────────────────────────────────
    public List<PaymentDto.Response> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdWithDetails(userId)
                .stream().map(PaymentDto.Response::from).toList();
    }

    // ── Admin: all payments ───────────────────────────────────────────────────
    public List<PaymentDto.Response> adminGetAll() {
        return paymentRepository.findAllWithDetails()
                .stream().map(PaymentDto.Response::from).toList();
    }

    // ── Stripe ────────────────────────────────────────────────────────────────
    private PaymentDto.CreateOrderResponse createStripeOrder(Payment payment, Plan plan,
                                                              BigDecimal amount, String currency) {
        try {
            Stripe.apiKey = stripeSecretKey;
            long cents = amount.multiply(BigDecimal.valueOf(100)).longValue();
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(cents)
                    .setCurrency(currency.toLowerCase())
                    .setDescription("WiFiExtender — " + plan.getName())
                    .putMetadata("paymentId", payment.getId().toString())
                    .putMetadata("planId",    plan.getId().toString())
                    .build();
            PaymentIntent intent = PaymentIntent.create(params);
            payment.setGatewayTxnId(intent.getId());
            payment.setGatewayOrderId(intent.getId());
            paymentRepository.save(payment);

            PaymentDto.CreateOrderResponse r = new PaymentDto.CreateOrderResponse();
            r.setGateway("STRIPE");
            r.setClientSecret(intent.getClientSecret());
            r.setOrderId(intent.getId());
            r.setAmount(amount);
            r.setCurrency(currency);
            r.setPaymentId(payment.getId());
            return r;
        } catch (Exception e) {
            log.error("Stripe order failed: {}", e.getMessage());
            throw new IllegalStateException("Stripe initialization failed: " + e.getMessage());
        }
    }

    private PaymentDto.Response verifyStripe(Payment payment, PaymentDto.VerifyRequest req) {
        try {
            Stripe.apiKey = stripeSecretKey;
            PaymentIntent intent = PaymentIntent.retrieve(req.getStripePaymentIntentId());
            if ("succeeded".equals(intent.getStatus())) {
                payment.setStatus(Payment.Status.SUCCESS);
                payment.setGatewayTxnId(intent.getId());
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                activateSubscriptionForPayment(payment);
            } else {
                payment.setStatus(Payment.Status.FAILED);
                paymentRepository.save(payment);
            }
        } catch (Exception e) {
            payment.setStatus(Payment.Status.FAILED);
            paymentRepository.save(payment);
            throw new IllegalStateException("Stripe verification failed: " + e.getMessage());
        }
        return PaymentDto.Response.from(payment);
    }

    // ── Razorpay ──────────────────────────────────────────────────────────────
    private PaymentDto.CreateOrderResponse createRazorpayOrder(Payment payment, Plan plan,
                                                                BigDecimal amount, String currency) {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost("https://api.razorpay.com/v1/orders");
            String auth = Base64.getEncoder().encodeToString(
                    (razorpayKeyId + ":" + razorpayKeySecret).getBytes(StandardCharsets.UTF_8));
            post.setHeader("Authorization", "Basic " + auth);
            post.setHeader("Content-Type", "application/json");
            long paise = amount.multiply(BigDecimal.valueOf(100)).longValue();
            post.setEntity(new StringEntity(String.format(
                    "{\"amount\":%d,\"currency\":\"%s\",\"receipt\":\"pay_%d\",\"notes\":{\"planId\":\"%d\"}}",
                    paise, currency, payment.getId(), plan.getId())));
            String resp = client.execute(post, r ->
                    new String(r.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));
            String orderId = extractJsonField(resp, "id");
            payment.setGatewayOrderId(orderId);
            paymentRepository.save(payment);

            PaymentDto.CreateOrderResponse r = new PaymentDto.CreateOrderResponse();
            r.setGateway("RAZORPAY");
            r.setOrderId(orderId);
            r.setRazorpayKeyId(razorpayKeyId);
            r.setAmount(amount);
            r.setCurrency(currency);
            r.setPaymentId(payment.getId());
            return r;
        } catch (Exception e) {
            log.error("Razorpay order failed: {}", e.getMessage());
            throw new IllegalStateException("Razorpay initialization failed: " + e.getMessage());
        }
    }

    private PaymentDto.Response verifyRazorpay(Payment payment, PaymentDto.VerifyRequest req) {
        try {
            String data = req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId();
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(razorpayKeySecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
            if (expected.equals(req.getRazorpaySignature())) {
                payment.setStatus(Payment.Status.SUCCESS);
                payment.setGatewayTxnId(req.getRazorpayPaymentId());
                payment.setGatewayOrderId(req.getRazorpayOrderId());
                payment.setGatewaySignature(req.getRazorpaySignature());
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
                activateSubscriptionForPayment(payment);
            } else {
                payment.setStatus(Payment.Status.FAILED);
                paymentRepository.save(payment);
                throw new IllegalStateException("Razorpay signature mismatch");
            }
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            payment.setStatus(Payment.Status.FAILED);
            paymentRepository.save(payment);
            throw new IllegalStateException("Razorpay verification error: " + e.getMessage());
        }
        return PaymentDto.Response.from(payment);
    }

    // ── PayPal ────────────────────────────────────────────────────────────────
    private PaymentDto.CreateOrderResponse createPaypalOrder(Payment payment, Plan plan,
                                                              BigDecimal amount, String currency) {
        try {
            String base = paypalBase();
            String token = getPaypalToken();
            try (CloseableHttpClient client = HttpClients.createDefault()) {
                HttpPost post = new HttpPost(base + "/v2/checkout/orders");
                post.setHeader("Authorization", "Bearer " + token);
                post.setHeader("Content-Type", "application/json");
                post.setEntity(new StringEntity(String.format(
                        "{\"intent\":\"CAPTURE\",\"purchase_units\":[{\"amount\":{\"currency_code\":\"%s\",\"value\":\"%s\"},\"description\":\"WiFiExtender - %s\"}],\"application_context\":{\"return_url\":\"%s/payment/success\",\"cancel_url\":\"%s/payment/cancel\"}}",
                        currency, amount.toPlainString(), plan.getName(), frontendUrl, frontendUrl)));
                String resp = client.execute(post, r ->
                        new String(r.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));
                String orderId = extractJsonField(resp, "id");
                String approvalUrl = extractApprovalUrl(resp);
                payment.setGatewayOrderId(orderId);
                paymentRepository.save(payment);

                PaymentDto.CreateOrderResponse r = new PaymentDto.CreateOrderResponse();
                r.setGateway("PAYPAL");
                r.setOrderId(orderId);
                r.setApprovalUrl(approvalUrl);
                r.setAmount(amount);
                r.setCurrency(currency);
                r.setPaymentId(payment.getId());
                return r;
            }
        } catch (Exception e) {
            log.error("PayPal order failed: {}", e.getMessage());
            throw new IllegalStateException("PayPal initialization failed: " + e.getMessage());
        }
    }

    private PaymentDto.Response verifyPaypal(Payment payment, PaymentDto.VerifyRequest req) {
        try {
            String base = paypalBase();
            String token = getPaypalToken();
            try (CloseableHttpClient client = HttpClients.createDefault()) {
                HttpPost post = new HttpPost(base + "/v2/checkout/orders/" + req.getPaypalOrderId() + "/capture");
                post.setHeader("Authorization", "Bearer " + token);
                post.setHeader("Content-Type", "application/json");
                post.setEntity(new StringEntity("{}"));
                String resp = client.execute(post, r ->
                        new String(r.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));
                if ("COMPLETED".equals(extractJsonField(resp, "status"))) {
                    payment.setStatus(Payment.Status.SUCCESS);
                    payment.setGatewayTxnId(req.getPaypalOrderId());
                    payment.setPaidAt(LocalDateTime.now());
                    paymentRepository.save(payment);
                    activateSubscriptionForPayment(payment);
                } else {
                    payment.setStatus(Payment.Status.FAILED);
                    paymentRepository.save(payment);
                }
            }
        } catch (Exception e) {
            payment.setStatus(Payment.Status.FAILED);
            paymentRepository.save(payment);
            throw new IllegalStateException("PayPal verification failed: " + e.getMessage());
        }
        return PaymentDto.Response.from(payment);
    }

    private String getPaypalToken() throws Exception {
        try (CloseableHttpClient client = HttpClients.createDefault()) {
            HttpPost post = new HttpPost(paypalBase() + "/v1/oauth2/token");
            post.setHeader("Authorization", "Basic " + Base64.getEncoder().encodeToString(
                    (paypalClientId + ":" + paypalClientSecret).getBytes(StandardCharsets.UTF_8)));
            post.setHeader("Content-Type", "application/x-www-form-urlencoded");
            post.setEntity(new StringEntity("grant_type=client_credentials"));
            String resp = client.execute(post, r ->
                    new String(r.getEntity().getContent().readAllBytes(), StandardCharsets.UTF_8));
            return extractJsonField(resp, "access_token");
        }
    }

    private String paypalBase() {
        return "sandbox".equals(paypalMode)
                ? "https://api-m.sandbox.paypal.com"
                : "https://api-m.paypal.com";
    }

    // ── Auto-activate subscription + issue license after payment ──────────────
    @Transactional
    public void activateSubscriptionForPayment(Payment payment) {
        try {
            User user = payment.getUser();

            // Find plan from payment description "Subscription: PlanName"
            String desc = payment.getDescription();
            if (desc == null || !desc.startsWith("Subscription: ")) {
                log.error("Cannot determine plan from payment {} description: {}", payment.getId(), desc);
                return;
            }
            String planName = desc.substring("Subscription: ".length()).trim();
            Plan plan = planRepository.findAll().stream()
                    .filter(p -> p.getName().equalsIgnoreCase(planName))
                    .findFirst()
                    .orElse(null);
            if (plan == null) {
                log.error("Plan '{}' not found for payment {}", planName, payment.getId());
                return;
            }

            // Cancel any existing active/pending subscriptions
            subscriptionRepository.findByUserIdWithPlan(user.getId()).stream()
                    .filter(s -> s.getStatus() == Subscription.Status.PENDING
                              || s.getStatus() == Subscription.Status.ACTIVE)
                    .forEach(s -> {
                        s.setStatus(Subscription.Status.CANCELLED);
                        s.setCancelledAt(LocalDateTime.now());
                        subscriptionRepository.save(s);
                        licenseRepository.findBySubscriptionId(s.getId()).forEach(l -> {
                            l.setStatus(License.Status.REVOKED);
                            licenseRepository.save(l);
                        });
                    });

            // Create and activate subscription
            LocalDateTime now = LocalDateTime.now();
            Subscription sub = new Subscription();
            sub.setUser(user);
            sub.setPlan(plan);
            sub.setStatus(Subscription.Status.ACTIVE);
            sub.setStartsAt(now);
            sub.setActivatedAt(now);
            sub.setAdminNotes("Auto-activated via " + payment.getGateway() + " payment #" + payment.getId());

            if (!plan.isLifetime()) {
                int days = plan.isFreeTrial() && plan.getTrialDays() > 0
                        ? plan.getTrialDays() : plan.getDurationDays();
                sub.setExpiresAt(now.plusDays(days > 0 ? days : 30));
            }
            if (plan.isFreeTrial() && plan.getTrialDays() > 0)
                sub.setTrialEndsAt(now.plusDays(plan.getTrialDays()));

            subscriptionRepository.save(sub);

            // Issue license key automatically
            License license = new License();
            license.setSubscription(sub);
            license.setUser(user);
            license.setLicenseKey(generateKey());
            license.setStatus(License.Status.ACTIVE);
            license.setExpiresAt(sub.getExpiresAt() != null
                    ? sub.getExpiresAt()
                    : LocalDateTime.now().plusYears(100));
            licenseRepository.save(license);

            // Link payment to subscription
            payment.setSubscription(sub);
            paymentRepository.save(payment);

            log.info("✅ Payment {} → Subscription {} → License {} auto-issued for user {}",
                    payment.getId(), sub.getId(), license.getLicenseKey(), user.getEmail());

        } catch (Exception e) {
            log.error("❌ Failed to activate subscription for payment {}: {}", payment.getId(), e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private String generateKey() {
        String raw = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return raw.substring(0,4) + "-" + raw.substring(4,8) + "-" + raw.substring(8,12)
             + "-" + raw.substring(12,16) + "-" + raw.substring(16,20);
    }

    private String extractJsonField(String json, String field) {
        String search = "\"" + field + "\"";
        int idx = json.indexOf(search);
        if (idx < 0) return "";
        int colon = json.indexOf(':', idx + search.length());
        if (colon < 0) return "";
        int start = json.indexOf('"', colon + 1);
        if (start < 0) return "";
        int end = json.indexOf('"', start + 1);
        return end > start ? json.substring(start + 1, end) : "";
    }

    private String extractApprovalUrl(String json) {
        int approveIdx = json.indexOf("\"approve\"");
        if (approveIdx < 0) return "";
        int hrefIdx = json.lastIndexOf("\"href\"", approveIdx);
        if (hrefIdx < 0) return "";
        int start = json.indexOf('"', json.indexOf(':', hrefIdx) + 1);
        int end   = json.indexOf('"', start + 1);
        return start >= 0 && end > start ? json.substring(start + 1, end) : "";
    }
}
