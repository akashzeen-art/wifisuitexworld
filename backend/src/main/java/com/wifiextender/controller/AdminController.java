package com.wifiextender.controller;

import com.wifiextender.dto.*;
import com.wifiextender.entity.*;
import com.wifiextender.repository.*;
import com.wifiextender.service.LicenseService;
import com.wifiextender.service.SubscriptionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Tag(name = "Admin", description = "Admin-only endpoints — requires ADMIN role")
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final UserRepository         userRepository;
    private final PlanRepository         planRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository      licenseRepository;
    private final HotspotRepository      hotspotRepository;
    private final ConnectedDeviceRepository deviceRepository;
    private final SubscriptionService    subscriptionService;
    private final LicenseService         licenseService;
    private final com.wifiextender.repository.PaymentRepository paymentRepository;

    // ── Stats ─────────────────────────────────────────────────────────────────
    @Operation(summary = "Get platform-wide stats")
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalUsers",           userRepository.count());
        stats.put("totalPlans",           planRepository.count());
        stats.put("activePlans",          planRepository.findByActiveTrueOrderBySortOrderAscPriceAsc().size());
        stats.put("totalSubscriptions",   subscriptionRepository.count());
        stats.put("activeSubscriptions",  subscriptionRepository.countAllActive());
        stats.put("pendingSubscriptions", subscriptionRepository.countAllPending());
        stats.put("activeLicenses",       licenseRepository.countActive());
        stats.put("activeHotspots",       hotspotRepository.countAllActive());
        stats.put("connectedDevices",     deviceRepository.countAllOnline());
        stats.put("totalRevenue",         paymentRepository.sumSuccessfulRevenue());
        stats.put("totalPayments",          paymentRepository.countSuccessful());
        return ResponseEntity.ok(stats);
    }

    // ── Users ─────────────────────────────────────────────────────────────────
    @Operation(summary = "List all users with optional pagination")
    @GetMapping("/users")
    public ResponseEntity<?> getUsers(
            @Parameter(description = "Page number (0-based)") @RequestParam(defaultValue = "0")  int page,
            @Parameter(description = "Page size")             @RequestParam(defaultValue = "50") int size,
            @Parameter(description = "Search by name/email") @RequestParam(required = false)    String search) {
        var all = userRepository.findAll().stream().map(u -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",        u.getId());
            m.put("name",      u.getName());
            m.put("email",     u.getEmail());
            m.put("role",      u.getRole().name());
            m.put("active",    u.isActive());
            m.put("lastLogin", u.getLastLogin());
            m.put("createdAt", u.getCreatedAt());
            return m;
        }).filter(u -> search == null || search.isBlank() ||
            u.get("name").toString().toLowerCase().contains(search.toLowerCase()) ||
            u.get("email").toString().toLowerCase().contains(search.toLowerCase())
        ).collect(Collectors.toList());

        int total = all.size();
        int from  = Math.min(page * size, total);
        int to    = Math.min(from + size, total);
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("content",       all.subList(from, to));
        result.put("page",          page);
        result.put("size",          size);
        result.put("totalElements", total);
        result.put("totalPages",    (int) Math.ceil((double) total / size));
        return ResponseEntity.ok(result);
    }

    // ── Active users ──────────────────────────────────────────────────────────
    @Operation(summary = "List users with currently active hotspots")
    @GetMapping("/active-users")
    public ResponseEntity<List<Map<String, Object>>> getActiveUsers() {
        List<Map<String, Object>> result = deviceRepository.findUsersWithActiveHotspot().stream().map(u -> {
            long hotspots = hotspotRepository.findAllActiveWithUser().stream()
                .filter(h -> h.getUser().getId().equals(u.getId())).count();
            long devices  = deviceRepository.countOnlineByUserId(u.getId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",               u.getId());
            m.put("name",             u.getName());
            m.put("email",            u.getEmail());
            m.put("activeHotspots",   hotspots);
            m.put("connectedDevices", devices);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Plans CRUD ────────────────────────────────────────────────────────────
    @Operation(summary = "List all plans")
    @GetMapping("/plans")
    public ResponseEntity<List<PlanDto.Response>> getPlans() {
        return ResponseEntity.ok(
            planRepository.findAll().stream().map(PlanDto.Response::from).collect(Collectors.toList())
        );
    }

    @Operation(summary = "Create a new plan")
    @PostMapping("/plans")
    public ResponseEntity<PlanDto.Response> createPlan(@Valid @RequestBody PlanDto.Request req) {
        Plan plan = new Plan();
        applyPlanFields(plan, req);
        return ResponseEntity.ok(PlanDto.Response.from(planRepository.save(plan)));
    }

    @Operation(summary = "Update a plan")
    @PutMapping("/plans/{id}")
    public ResponseEntity<PlanDto.Response> updatePlan(@PathVariable Long id, @Valid @RequestBody PlanDto.Request req) {
        Plan plan = planRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        applyPlanFields(plan, req);
        return ResponseEntity.ok(PlanDto.Response.from(planRepository.save(plan)));
    }

    @Operation(summary = "Toggle plan active/inactive")
    @PatchMapping("/plans/{id}/toggle")
    public ResponseEntity<PlanDto.Response> togglePlan(@PathVariable Long id) {
        Plan plan = planRepository.findById(id).orElseThrow(() -> new IllegalArgumentException("Plan not found"));
        plan.setActive(!plan.isActive());
        return ResponseEntity.ok(PlanDto.Response.from(planRepository.save(plan)));
    }

    @Operation(summary = "Delete a plan")
    @DeleteMapping("/plans/{id}")
    public ResponseEntity<Void> deletePlan(@PathVariable Long id) {
        planRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ── Subscriptions ─────────────────────────────────────────────────────────
    @Operation(summary = "List all subscriptions with optional status filter and pagination")
    @GetMapping("/subscriptions")
    public ResponseEntity<List<SubscriptionDto.Response>> getAllSubscriptions(
            @RequestParam(required = false) String status) {
        var all = subscriptionService.adminGetAll();
        if (status != null && !status.isBlank())
            all = all.stream().filter(s -> s.getStatus().equalsIgnoreCase(status)).collect(Collectors.toList());
        return ResponseEntity.ok(all);
    }

    @Operation(summary = "Assign a plan directly to a user")
    @PostMapping("/subscriptions/assign")
    public ResponseEntity<SubscriptionDto.Response> assignPlan(
            @AuthenticationPrincipal User admin,
            @Valid @RequestBody SubscriptionDto.AssignRequest req) {
        return ResponseEntity.ok(subscriptionService.adminAssign(admin, req));
    }

    @Operation(summary = "Activate a pending subscription")
    @PostMapping("/subscriptions/{id}/activate")
    public ResponseEntity<SubscriptionDto.Response> activateSubscription(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> body) {
        return ResponseEntity.ok(subscriptionService.adminActivate(admin, id, body != null ? body.get("notes") : null));
    }

    @Operation(summary = "Extend a subscription by N days")
    @PostMapping("/subscriptions/{id}/extend")
    public ResponseEntity<SubscriptionDto.Response> extendSubscription(
            @AuthenticationPrincipal User admin,
            @PathVariable Long id,
            @Valid @RequestBody SubscriptionDto.ExtendRequest req) {
        return ResponseEntity.ok(subscriptionService.adminExtend(admin, id, req));
    }

    @Operation(summary = "Disable a subscription and revoke its licenses")
    @PostMapping("/subscriptions/{id}/disable")
    public ResponseEntity<SubscriptionDto.Response> disableSubscription(
            @PathVariable Long id,
            @RequestBody(required = false) SubscriptionDto.DisableRequest req) {
        return ResponseEntity.ok(subscriptionService.adminDisable(id, req != null ? req.getReason() : null));
    }

    // ── Licenses ──────────────────────────────────────────────────────────────
    @Operation(summary = "List all licenses with optional status filter")
    @GetMapping("/licenses")
    public ResponseEntity<List<LicenseDto.Response>> getAllLicenses() {
        return ResponseEntity.ok(licenseService.adminGetAll());
    }

    @Operation(summary = "Revoke a license")
    @PostMapping("/licenses/{id}/revoke")
    public ResponseEntity<LicenseDto.Response> revokeLicense(
            @PathVariable Long id,
            @AuthenticationPrincipal User admin,
            @RequestBody(required = false) LicenseDto.RevokeRequest req) {
        return ResponseEntity.ok(licenseService.adminRevoke(id, admin, req != null ? req.getReason() : null));
    }

    @Operation(summary = "Reset machine binding — allows re-activation on a new device")
    @PostMapping("/licenses/{id}/reset-machine")
    public ResponseEntity<LicenseDto.Response> resetMachine(@PathVariable Long id) {
        return ResponseEntity.ok(licenseService.adminResetMachine(id));
    }

    @Operation(summary = "Get activation history for a license")
    @GetMapping("/licenses/{id}/activations")
    public ResponseEntity<List<LicenseDto.ActivationRecord>> getActivations(@PathVariable Long id) {
        return ResponseEntity.ok(licenseService.getActivationHistory(id));
    }

    @Operation(summary = "Get license statistics")
    @GetMapping("/licenses/stats")
    public ResponseEntity<Map<String, Long>> getLicenseStats() {
        return ResponseEntity.ok(Map.of(
            "total",     licenseRepository.count(),
            "active",    licenseRepository.countActive(),
            "revoked",   licenseRepository.countRevoked(),
            "activated", licenseRepository.countActivated()
        ));
    }

    // ── Hotspots ──────────────────────────────────────────────────────────────
    @Operation(summary = "List all hotspots across all users")
    @GetMapping("/hotspots")
    public ResponseEntity<List<Map<String, Object>>> getAllHotspots() {
        List<Map<String, Object>> result = hotspotRepository.findAllWithUser().stream().map(h -> {
            long connectedDevices = deviceRepository.countActiveByHotspotId(h.getId());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",               h.getId());
            m.put("ssid",             h.getSsid());
            m.put("status",           h.getStatus().name());
            m.put("maxClients",       h.getMaxClients());
            m.put("connectedDevices", connectedDevices);
            m.put("totalBytesUp",     h.getTotalBytesUp());
            m.put("totalBytesDown",   h.getTotalBytesDown());
            m.put("startedAt",        h.getStartedAt());
            m.put("stoppedAt",        h.getStoppedAt());
            m.put("createdAt",        h.getCreatedAt());
            m.put("userId",           h.getUser().getId());
            m.put("userName",         h.getUser().getName());
            m.put("userEmail",        h.getUser().getEmail());
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Connected Devices ─────────────────────────────────────────────────────
    @Operation(summary = "List all connected devices across all users")
    @GetMapping("/devices")
    public ResponseEntity<List<Map<String, Object>>> getAllDevices() {
        List<Map<String, Object>> result = deviceRepository.findAllWithUser().stream().map(d -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id",           d.getId());
            m.put("macAddress",   d.getMacAddress());
            m.put("deviceName",   d.getDeviceName());
            m.put("deviceType",   d.getDeviceType() != null ? d.getDeviceType().name() : "UNKNOWN");
            m.put("ipAddress",    d.getIpAddress());
            m.put("blocked",      d.isBlocked());
            m.put("online",       d.isOnline());
            m.put("bytesSent",    d.getBytesSent());
            m.put("bytesReceived",d.getBytesReceived());
            m.put("lastSeen",     d.getLastSeen());
            m.put("userId",       d.getUser().getId());
            m.put("userName",     d.getUser().getName());
            m.put("userEmail",    d.getUser().getEmail());
            m.put("hotspotId",    d.getHotspot() != null ? d.getHotspot().getId() : null);
            m.put("ssid",         d.getHotspot() != null ? d.getHotspot().getSsid() : null);
            return m;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    // ── Analytics ─────────────────────────────────────────────────────────────
    @Operation(summary = "Get platform analytics for a given time range (7d, 30d, 90d, 1y)")
    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics(
            @RequestParam(defaultValue = "30d") String range) {

        LocalDateTime from = switch (range) {
            case "7d"  -> LocalDateTime.now().minusDays(7);
            case "90d" -> LocalDateTime.now().minusDays(90);
            case "1y"  -> LocalDateTime.now().minusYears(1);
            default    -> LocalDateTime.now().minusDays(30);
        };

        // User growth by day
        List<Map<String, Object>> userChart = userRepository.countByDay(from).stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());
            m.put("users", row[1]);
            return m;
        }).collect(Collectors.toList());

        // Subscriptions by day
        List<Map<String, Object>> subChart = subscriptionRepository.countByDay(from).stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("date",  row[0].toString());
            m.put("count", row[1]);
            return m;
        }).collect(Collectors.toList());

        // Device type breakdown
        List<Map<String, Object>> deviceTypes = deviceRepository.countByDeviceType().stream().map(row -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("type",  row[0] != null ? row[0].toString() : "UNKNOWN");
            m.put("count", row[1]);
            return m;
        }).collect(Collectors.toList());

        // Traffic per hotspot aggregated (simple total for now)
        long totalUp   = hotspotRepository.findAll().stream().mapToLong(Hotspot::getTotalBytesUp).sum();
        long totalDown = hotspotRepository.findAll().stream().mapToLong(Hotspot::getTotalBytesDown).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalRevenue",      0.0);
        result.put("newUsers",          userRepository.countCreatedAfter(from));
        result.put("newSubscriptions",  subscriptionRepository.countActiveCreatedAfter(from));
        result.put("activeHotspots",    hotspotRepository.countAllActive());
        result.put("userChart",         userChart);
        result.put("subscriptionChart", subChart);
        result.put("deviceTypes",       deviceTypes);
        Map<String, Object> trafficEntry = new LinkedHashMap<>();
        trafficEntry.put("date", "Total");
        trafficEntry.put("up",   totalUp);
        trafficEntry.put("down", totalDown);
        result.put("revenueChart",      List.of());
        result.put("trafficChart",      List.of(trafficEntry));
        return ResponseEntity.ok(result);
    }

    // ── Reports ───────────────────────────────────────────────────────────────
    @Operation(summary = "Download a report as CSV or JSON (type: users|subscriptions|licenses|hotspots|devices|revenue)")
    @GetMapping("/reports/{type}")
    public void downloadReport(
            @PathVariable String type,
            @RequestParam(defaultValue = "csv") String format,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            HttpServletResponse response) throws IOException {

        String filename = type + "-report-" + LocalDate.now() + "." + format;
        response.setHeader("Content-Disposition", "attachment; filename=\"" + filename + "\"");

        if ("json".equalsIgnoreCase(format)) {
            response.setContentType("application/json");
            response.getWriter().write(buildJsonReport(type));
        } else {
            response.setContentType("text/csv");
            writeCsvReport(type, response.getWriter());
        }
    }

    private String buildJsonReport(String type) {
        return switch (type) {
            case "users" -> toJson(userRepository.findAll().stream().map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",        u.getId());
                m.put("name",      u.getName());
                m.put("email",     u.getEmail());
                m.put("role",      u.getRole().name());
                m.put("active",    u.isActive());
                m.put("createdAt", String.valueOf(u.getCreatedAt()));
                return m;
            }).collect(Collectors.toList()));
            case "hotspots" -> toJson(hotspotRepository.findAllWithUser().stream().map(h -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",        h.getId());
                m.put("ssid",      h.getSsid());
                m.put("status",    h.getStatus().name());
                m.put("user",      h.getUser().getEmail());
                m.put("bytesUp",   h.getTotalBytesUp());
                m.put("bytesDown", h.getTotalBytesDown());
                return m;
            }).collect(Collectors.toList()));
            case "devices" -> toJson(deviceRepository.findAllWithUser().stream().map(d -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",      d.getId());
                m.put("mac",     d.getMacAddress());
                m.put("type",    d.getDeviceType() != null ? d.getDeviceType().name() : "UNKNOWN");
                m.put("blocked", d.isBlocked());
                m.put("user",    d.getUser().getEmail());
                return m;
            }).collect(Collectors.toList()));
            default -> "[]";
        };
    }

    private void writeCsvReport(String type, PrintWriter w) {
        switch (type) {
            case "users" -> {
                w.println("ID,Name,Email,Role,Active,CreatedAt");
                userRepository.findAll().forEach(u ->
                    w.printf("%d,%s,%s,%s,%b,%s%n",
                        u.getId(), u.getName(), u.getEmail(),
                        u.getRole().name(), u.isActive(), u.getCreatedAt()));
            }
            case "subscriptions" -> {
                w.println("ID,User,Plan,Status,StartsAt,ExpiresAt");
                subscriptionRepository.findAllWithDetails().forEach(s ->
                    w.printf("%d,%s,%s,%s,%s,%s%n",
                        s.getId(), s.getUser().getEmail(), s.getPlan().getName(),
                        s.getStatus().name(), s.getStartsAt(), s.getExpiresAt()));
            }
            case "licenses" -> {
                w.println("ID,User,LicenseKey,Plan,Status,ExpiresAt");
                licenseRepository.findAllWithDetails().forEach(l ->
                    w.printf("%d,%s,%s,%s,%s,%s%n",
                        l.getId(), l.getUser().getEmail(), l.getLicenseKey(),
                        l.getSubscription().getPlan().getName(),
                        l.getStatus().name(), l.getExpiresAt()));
            }
            case "hotspots" -> {
                w.println("ID,SSID,User,Status,BytesUp,BytesDown,StartedAt,StoppedAt");
                hotspotRepository.findAllWithUser().forEach(h ->
                    w.printf("%d,%s,%s,%s,%d,%d,%s,%s%n",
                        h.getId(), h.getSsid(), h.getUser().getEmail(),
                        h.getStatus().name(), h.getTotalBytesUp(), h.getTotalBytesDown(),
                        h.getStartedAt(), h.getStoppedAt()));
            }
            case "devices" -> {
                w.println("ID,MAC,DeviceName,Type,User,Hotspot,Blocked,BytesSent,BytesReceived,LastSeen");
                deviceRepository.findAllWithUser().forEach(d ->
                    w.printf("%d,%s,%s,%s,%s,%s,%b,%d,%d,%s%n",
                        d.getId(), d.getMacAddress(), d.getDeviceName(),
                        d.getDeviceType() != null ? d.getDeviceType().name() : "UNKNOWN",
                        d.getUser().getEmail(),
                        d.getHotspot() != null ? d.getHotspot().getSsid() : "",
                        d.isBlocked(), d.getBytesSent(), d.getBytesReceived(), d.getLastSeen()));
            }
            default -> w.println("No data");
        }
    }

    private String toJson(List<Map<String, Object>> list) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < list.size(); i++) {
            sb.append("{");
            list.get(i).forEach((k, v) ->
                sb.append("\"").append(k).append("\":\"").append(v).append("\","));
            if (sb.charAt(sb.length() - 1) == ',') sb.deleteCharAt(sb.length() - 1);
            sb.append("}");
            if (i < list.size() - 1) sb.append(",");
        }
        return sb.append("]").toString();
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void applyPlanFields(Plan plan, PlanDto.Request req) {
        plan.setName(req.getName());
        plan.setDescription(req.getDescription());
        plan.setPrice(req.getPrice());
        plan.setDurationDays(req.getDurationDays());
        plan.setTrialDays(req.getTrialDays() != null ? req.getTrialDays() : 0);
        plan.setMaxDevices(req.getMaxDevices());
        plan.setSortOrder(req.getSortOrder() != null ? req.getSortOrder() : 0);
        plan.setPopular(req.isPopular());
        plan.setFeatures(req.getFeatures());
        if (req.getPlanType() != null)
            plan.setPlanType(Plan.PlanType.valueOf(req.getPlanType().toUpperCase()));
    }
}
