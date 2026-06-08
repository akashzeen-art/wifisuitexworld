package com.wifiextender.controller;

import com.wifiextender.dto.HotspotDto;
import com.wifiextender.entity.User;
import com.wifiextender.service.HotspotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Hotspots", description = "Manage WiFi hotspot sessions")
@RestController
@RequestMapping("/api/hotspots")
@RequiredArgsConstructor
public class HotspotController {

    private final HotspotService hotspotService;

    @Operation(summary = "List all hotspots for the authenticated user")
    @GetMapping
    public ResponseEntity<List<HotspotDto.Response>> list(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hotspotService.getUserHotspots(user.getId()));
    }

    @Operation(summary = "Get currently active hotspot")
    @GetMapping("/active")
    public ResponseEntity<HotspotDto.Response> active(@AuthenticationPrincipal User user) {
        HotspotDto.Response active = hotspotService.getActive(user.getId());
        return active != null ? ResponseEntity.ok(active) : ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get hotspot by ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Hotspot found"),
        @ApiResponse(responseCode = "404", description = "Hotspot not found")
    })
    @GetMapping("/{id}")
    public ResponseEntity<HotspotDto.Response> get(
            @Parameter(description = "Hotspot ID") @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hotspotService.getHotspot(id, user.getId()));
    }

    @Operation(summary = "Create a new hotspot")
    @ApiResponse(responseCode = "201", description = "Hotspot created")
    @PostMapping
    public ResponseEntity<HotspotDto.Response> create(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody HotspotDto.CreateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(hotspotService.create(user, req));
    }

    @Operation(summary = "Update hotspot SSID, password or max clients")
    @PutMapping("/{id}")
    public ResponseEntity<HotspotDto.Response> update(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @Valid @RequestBody HotspotDto.UpdateRequest req) {
        return ResponseEntity.ok(hotspotService.update(id, user.getId(), req));
    }

    @Operation(summary = "Start the hotspot")
    @PostMapping("/{id}/start")
    public ResponseEntity<HotspotDto.Response> start(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hotspotService.start(id, user.getId()));
    }

    @Operation(summary = "Stop the hotspot")
    @PostMapping("/{id}/stop")
    public ResponseEntity<HotspotDto.Response> stop(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(hotspotService.stop(id, user.getId()));
    }

    @Operation(summary = "Delete a hotspot (must be stopped first)")
    @ApiResponse(responseCode = "204", description = "Hotspot deleted")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        hotspotService.delete(id, user.getId());
        return ResponseEntity.noContent().build();
    }
}
