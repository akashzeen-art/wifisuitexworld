package com.wifiextender.controller;

import com.wifiextender.dto.DeviceDto;
import com.wifiextender.dto.PageResponse;
import com.wifiextender.entity.User;
import com.wifiextender.service.DeviceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Devices", description = "Connected device monitoring and management")
@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
public class DeviceController {

    private final DeviceService deviceService;

    @Operation(summary = "List all devices for the authenticated user")
    @GetMapping
    public ResponseEntity<List<DeviceDto.Response>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(deviceService.getDevices(user.getId()));
    }

    @Operation(summary = "Get device statistics for the authenticated user")
    @GetMapping("/stats")
    public ResponseEntity<DeviceDto.Stats> stats(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(deviceService.getStats(user.getId()));
    }

    @Operation(summary = "Report a single device (upsert by MAC address)")
    @PostMapping("/report")
    public ResponseEntity<DeviceDto.Response> report(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody DeviceDto.ReportRequest req) {
        return ResponseEntity.ok(deviceService.reportDevice(user, req));
    }

    @Operation(summary = "Bulk report all devices from the desktop app")
    @PostMapping("/report/bulk")
    public ResponseEntity<List<DeviceDto.Response>> bulkReport(
            @AuthenticationPrincipal User user,
            @RequestBody DeviceDto.BulkReportRequest req) {
        return ResponseEntity.ok(deviceService.bulkReport(user, req));
    }

    @Operation(summary = "Toggle block/unblock a device")
    @PutMapping("/{id}/block")
    public ResponseEntity<DeviceDto.Response> toggleBlock(
            @Parameter(description = "Device ID") @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(deviceService.toggleBlock(id, user.getId()));
    }

    @Operation(summary = "Mark a device as offline")
    @PostMapping("/{id}/offline")
    public ResponseEntity<Void> markOffline(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        deviceService.markOffline(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
