package com.wifiextender.controller;

import com.wifiextender.dto.LicenseDto;
import com.wifiextender.dto.PlanDto;
import com.wifiextender.dto.SubscriptionDto;
import com.wifiextender.entity.User;
import com.wifiextender.repository.PlanRepository;
import com.wifiextender.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Tag(name = "Subscriptions", description = "Plan subscriptions and license management")
@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionService subscriptionService;
    private final PlanRepository      planRepository;

    @Operation(summary = "List all active plans (public)")
    @SecurityRequirements
    @GetMapping("/plans")
    public ResponseEntity<List<PlanDto.Response>> getPlans() {
        return ResponseEntity.ok(
            planRepository.findByActiveTrueOrderBySortOrderAscPriceAsc()
                .stream().map(PlanDto.Response::from).collect(Collectors.toList())
        );
    }

    @Operation(summary = "Get my subscriptions")
    @GetMapping
    public ResponseEntity<List<SubscriptionDto.Response>> mySubscriptions(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getUserSubscriptions(user.getId()));
    }

    @Operation(summary = "Get my active subscription")
    @GetMapping("/active")
    public ResponseEntity<SubscriptionDto.Response> activeSub(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getActiveSub(user.getId()));
    }

    @Operation(summary = "Request a plan — creates a PENDING subscription (admin must activate)")
    @PostMapping("/request/{planId}")
    public ResponseEntity<SubscriptionDto.Response> requestPlan(
            @AuthenticationPrincipal User user,
            @PathVariable Long planId) {
        return ResponseEntity.ok(subscriptionService.requestPlan(user, planId));
    }

    @Operation(summary = "Validate a license key")
    @PostMapping("/validate")
    public ResponseEntity<LicenseDto.Response> validate(@RequestBody LicenseDto.ValidateRequest req) {
        return ResponseEntity.ok(subscriptionService.validateLicense(req.getLicenseKey()));
    }

    @Operation(summary = "Get my license keys")
    @GetMapping("/licenses")
    public ResponseEntity<List<LicenseDto.Response>> myLicenses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(subscriptionService.getUserLicenses(user.getId()));
    }
}
