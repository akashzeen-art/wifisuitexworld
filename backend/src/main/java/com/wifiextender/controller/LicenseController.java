package com.wifiextender.controller;

import com.wifiextender.dto.LicenseDto;
import com.wifiextender.entity.User;
import com.wifiextender.service.LicenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@Tag(name = "Licenses", description = "License activation, validation and management")
@RestController
@RequestMapping("/api/licenses")
@RequiredArgsConstructor
public class LicenseController {

    private final LicenseService licenseService;

    @Operation(summary = "Activate a license key — binds to machine on first call")
    @PostMapping("/activate")
    public ResponseEntity<LicenseDto.ActivateResponse> activate(
            @Valid @RequestBody LicenseDto.ActivateRequest req,
            HttpServletRequest httpReq) {
        if (req.getIpAddress() == null) req.setIpAddress(httpReq.getRemoteAddr());
        return ResponseEntity.ok(licenseService.activate(req));
    }

    @Operation(summary = "Validate an already-activated license (heartbeat)")
    @PostMapping("/validate")
    public ResponseEntity<LicenseDto.ActivateResponse> validate(
            @Valid @RequestBody LicenseDto.ValidateRequest req) {
        return ResponseEntity.ok(licenseService.validate(req));
    }

    @Operation(summary = "Get all licenses for the authenticated user")
    @GetMapping
    public ResponseEntity<List<LicenseDto.Response>> myLicenses(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(licenseService.getUserLicenses(user.getId()));
    }

    @Operation(summary = "Deactivate a license — unbinds machine, allows re-activation on new device")
    @PostMapping("/{key}/deactivate")
    public ResponseEntity<LicenseDto.Response> deactivate(
            @PathVariable String key,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(licenseService.deactivate(key, user.getId()));
    }
}
