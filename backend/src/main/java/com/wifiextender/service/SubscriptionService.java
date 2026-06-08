package com.wifiextender.service;

import com.wifiextender.dto.LicenseDto;
import com.wifiextender.dto.SubscriptionDto;
import com.wifiextender.entity.*;
import com.wifiextender.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SubscriptionService {

    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository      licenseRepository;
    private final PlanRepository         planRepository;
    private final UserRepository         userRepository;
    private final ConnectedDeviceRepository deviceRepository;

    // ── User: get my subscriptions ────────────────────────────────────────────
    public List<SubscriptionDto.Response> getUserSubscriptions(Long userId) {
        return subscriptionRepository.findByUserIdWithPlan(userId)
                .stream().map(SubscriptionDto.Response::from).collect(Collectors.toList());
    }

    // ── User: get active subscription ─────────────────────────────────────────
    public SubscriptionDto.Response getActiveSub(Long userId) {
        return subscriptionRepository.findActiveByUserId(userId)
                .map(SubscriptionDto.Response::from)
                .orElse(null);
    }

    // ── User: request a plan — auto-activates immediately, no admin needed ──
    @Transactional
    public SubscriptionDto.Response requestPlan(User user, Long planId) {
        Plan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        if (!plan.isActive())
            throw new IllegalArgumentException("Plan is no longer available");

        // Cancel any existing pending or active subscription
        subscriptionRepository.findByUserIdWithPlan(user.getId()).stream()
                .filter(s -> s.getStatus() == Subscription.Status.PENDING
                          || s.getStatus() == Subscription.Status.ACTIVE)
                .forEach(s -> {
                    s.setStatus(Subscription.Status.CANCELLED);
                    s.setCancelledAt(LocalDateTime.now());
                    subscriptionRepository.save(s);
                    // Revoke existing licenses
                    licenseRepository.findBySubscriptionId(s.getId()).forEach(l -> {
                        l.setStatus(License.Status.REVOKED);
                        licenseRepository.save(l);
                    });
                });

        LocalDateTime now = LocalDateTime.now();
        Subscription sub = new Subscription();
        sub.setUser(user);
        sub.setPlan(plan);
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setStartsAt(now);
        sub.setActivatedAt(now);
        sub.setAdminNotes("Auto-activated on request");

        if (!plan.isLifetime()) {
            int days = plan.isFreeTrial() ? plan.getTrialDays() : plan.getDurationDays();
            sub.setExpiresAt(now.plusDays(days > 0 ? days : 30));
        }
        if (plan.isFreeTrial() && plan.getTrialDays() > 0) {
            sub.setTrialEndsAt(now.plusDays(plan.getTrialDays()));
        }

        subscriptionRepository.save(sub);
        issueLicense(sub);
        return SubscriptionDto.Response.from(sub);
    }

    // ── Admin: assign plan directly to user ───────────────────────────────────
    @Transactional
    public SubscriptionDto.Response adminAssign(User admin, SubscriptionDto.AssignRequest req) {
        User targetUser = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        Plan plan = planRepository.findById(req.getPlanId())
                .orElseThrow(() -> new IllegalArgumentException("Plan not found"));

        // Deactivate any existing active subscription
        subscriptionRepository.findActiveByUserId(targetUser.getId()).ifPresent(existing -> {
            existing.setStatus(Subscription.Status.CANCELLED);
            existing.setCancelledAt(LocalDateTime.now());
            subscriptionRepository.save(existing);
        });

        LocalDateTime now = LocalDateTime.now();
        Subscription sub = new Subscription();
        sub.setUser(targetUser);
        sub.setPlan(plan);
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setStartsAt(now);
        sub.setActivatedAt(now);
        sub.setActivatedBy(admin);
        sub.setAdminNotes(req.getNotes());

        // Expiry: lifetime = null, else use override or plan default
        if (!plan.isLifetime()) {
            int days = req.getDurationDays() != null ? req.getDurationDays() : plan.getDurationDays();
            sub.setExpiresAt(now.plusDays(days));
        }

        // Free trial
        if (plan.isFreeTrial() && plan.getTrialDays() > 0) {
            sub.setTrialEndsAt(now.plusDays(plan.getTrialDays()));
        }

        subscriptionRepository.save(sub);
        issueLicense(sub);
        return SubscriptionDto.Response.from(sub);
    }

    // ── Admin: activate a PENDING subscription ────────────────────────────────
    @Transactional
    public SubscriptionDto.Response adminActivate(User admin, Long subscriptionId, String notes) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        if (sub.getStatus() != Subscription.Status.PENDING)
            throw new IllegalStateException("Only PENDING subscriptions can be activated");

        LocalDateTime now = LocalDateTime.now();
        sub.setStatus(Subscription.Status.ACTIVE);
        sub.setStartsAt(now);
        sub.setActivatedAt(now);
        sub.setActivatedBy(admin);
        if (notes != null) sub.setAdminNotes(notes);

        Plan plan = sub.getPlan();
        if (!plan.isLifetime()) {
            sub.setExpiresAt(now.plusDays(plan.getDurationDays()));
        }
        if (plan.isFreeTrial() && plan.getTrialDays() > 0) {
            sub.setTrialEndsAt(now.plusDays(plan.getTrialDays()));
        }

        subscriptionRepository.save(sub);
        issueLicense(sub);
        return SubscriptionDto.Response.from(sub);
    }

    // ── Admin: extend subscription ────────────────────────────────────────────
    @Transactional
    public SubscriptionDto.Response adminExtend(User admin, Long subscriptionId, SubscriptionDto.ExtendRequest req) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        if (sub.getPlan().isLifetime())
            throw new IllegalStateException("Cannot extend a lifetime subscription");

        LocalDateTime base = sub.getExpiresAt() != null && sub.getExpiresAt().isAfter(LocalDateTime.now())
                ? sub.getExpiresAt()
                : LocalDateTime.now();
        sub.setExpiresAt(base.plusDays(req.getDays()));
        if (sub.getStatus() == Subscription.Status.EXPIRED)
            sub.setStatus(Subscription.Status.ACTIVE);
        if (req.getNotes() != null)
            sub.setAdminNotes(req.getNotes());

        // Extend license too
        licenseRepository.findBySubscriptionId(subscriptionId).forEach(l -> {
            l.setExpiresAt(sub.getExpiresAt());
            licenseRepository.save(l);
        });

        return SubscriptionDto.Response.from(subscriptionRepository.save(sub));
    }

    // ── Admin: disable subscription ───────────────────────────────────────────
    @Transactional
    public SubscriptionDto.Response adminDisable(Long subscriptionId, String reason) {
        Subscription sub = subscriptionRepository.findById(subscriptionId)
                .orElseThrow(() -> new IllegalArgumentException("Subscription not found"));
        sub.setStatus(Subscription.Status.DISABLED);
        sub.setCancelledAt(LocalDateTime.now());
        if (reason != null) sub.setAdminNotes(reason);

        // Revoke all licenses
        licenseRepository.findBySubscriptionId(subscriptionId).forEach(l -> {
            l.setStatus(License.Status.REVOKED);
            licenseRepository.save(l);
        });

        return SubscriptionDto.Response.from(subscriptionRepository.save(sub));
    }

    // ── Admin: get all subscriptions ──────────────────────────────────────────
    public List<SubscriptionDto.Response> adminGetAll() {
        return subscriptionRepository.findAllWithDetails()
                .stream().map(SubscriptionDto.Response::from).collect(Collectors.toList());
    }

    // ── Device limit check ────────────────────────────────────────────────────
    public void checkDeviceLimit(Long userId) {
        Subscription sub = subscriptionRepository.findActiveByUserId(userId)
                .orElseThrow(() -> new IllegalStateException("No active subscription"));
        if (sub.getPlan().hasUnlimitedDevices()) return;

        long connected = deviceRepository.countActiveByHotspotId(userId); // reuse active count
        if (connected >= sub.getPlan().getMaxDevices())
            throw new IllegalStateException("Device limit reached for your plan (" + sub.getPlan().getMaxDevices() + " devices)");
    }

    // ── License validation ────────────────────────────────────────────────────
    public LicenseDto.Response validateLicense(String key) {
        License license = licenseRepository.findByLicenseKey(key)
                .orElseThrow(() -> new IllegalArgumentException("Invalid license key"));
        if (license.getStatus() == License.Status.REVOKED)
            throw new IllegalStateException("License has been revoked");
        if (license.isExpired()) {
            license.setStatus(License.Status.EXPIRED);
            licenseRepository.save(license);
            throw new IllegalStateException("License has expired");
        }
        if (license.getActivatedAt() == null) {
            license.setActivatedAt(LocalDateTime.now());
            licenseRepository.save(license);
        }
        return LicenseDto.Response.from(license);
    }

    public List<LicenseDto.Response> getUserLicenses(Long userId) {
        return licenseRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(LicenseDto.Response::from).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void issueLicense(Subscription sub) {
        License license = new License();
        license.setSubscription(sub);
        license.setUser(sub.getUser());
        license.setLicenseKey(generateKey());
        license.setStatus(License.Status.ACTIVE);
        license.setExpiresAt(sub.getExpiresAt() != null ? sub.getExpiresAt() : LocalDateTime.now().plusYears(100));
        licenseRepository.save(license);
    }

    private String generateKey() {
        String raw = UUID.randomUUID().toString().replace("-", "").toUpperCase();
        return raw.substring(0,4) + "-" + raw.substring(4,8) + "-" + raw.substring(8,12) + "-" + raw.substring(12,16) + "-" + raw.substring(16,20);
    }
}
