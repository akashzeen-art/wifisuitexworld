package com.wifiextender.service;

import com.wifiextender.dto.LicenseDto;
import com.wifiextender.entity.*;
import com.wifiextender.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LicenseService {

    private final LicenseRepository           licenseRepository;
    private final LicenseActivationRepository activationRepository;
    private final UserRepository              userRepository;

    // ── Activate: bind license to machine on first use ────────────────────────
    @Transactional
    public LicenseDto.ActivateResponse activate(LicenseDto.ActivateRequest req) {
        License license = licenseRepository.findByLicenseKey(req.getLicenseKey())
                .orElseThrow(() -> new IllegalArgumentException("Invalid license key"));

        LicenseDto.ActivateResponse resp = new LicenseDto.ActivateResponse();

        // ── Guard checks ──────────────────────────────────────────────────────
        if (license.getStatus() == License.Status.REVOKED) {
            recordActivation(license, req, LicenseActivation.Result.FAILED, "License has been revoked");
            throw new IllegalStateException("License has been revoked");
        }
        if (license.isExpired()) {
            license.setStatus(License.Status.EXPIRED);
            licenseRepository.save(license);
            recordActivation(license, req, LicenseActivation.Result.FAILED, "License has expired");
            throw new IllegalStateException("License has expired");
        }

        // ── Machine binding ───────────────────────────────────────────────────
        if (license.isBoundToMachine()) {
            if (!license.matchesMachine(req.getMachineId())) {
                recordActivation(license, req, LicenseActivation.Result.FAILED,
                        "License is bound to a different machine");
                throw new IllegalStateException(
                        "This license is already activated on another device. " +
                        "Contact support to transfer your license.");
            }
            // Same machine — re-validation / re-activation
            license.setLastCheckedAt(LocalDateTime.now());
            licenseRepository.save(license);
            recordActivation(license, req, LicenseActivation.Result.REACTIVATED, null);
            log.info("License {} re-validated on machine {}", license.getLicenseKey(), req.getMachineId());
        } else {
            // First activation — bind to this machine
            license.setMachineId(req.getMachineId());
            license.setMachineLabel(req.getMachineLabel());
            license.setActivatedAt(LocalDateTime.now());
            license.setLastCheckedAt(LocalDateTime.now());
            license.setActivationCount(license.getActivationCount() + 1);
            licenseRepository.save(license);
            recordActivation(license, req, LicenseActivation.Result.SUCCESS, null);
            log.info("License {} activated on machine {} ({})", license.getLicenseKey(), req.getMachineId(), req.getMachineLabel());
        }

        // ── Build response ────────────────────────────────────────────────────
        Plan plan = license.getSubscription().getPlan();
        resp.setSuccess(true);
        resp.setMessage(license.isBoundToMachine() && license.getActivationCount() > 1
                ? "License re-validated successfully"
                : "License activated successfully");
        resp.setLicense(LicenseDto.Response.from(license));
        resp.setPlanName(plan != null ? plan.getName() : null);
        resp.setMaxDevices(plan != null ? plan.getMaxDevices() : 0);
        resp.setUnlimitedDevices(plan != null && plan.hasUnlimitedDevices());
        resp.setExpiresAt(license.getExpiresAt());
        resp.setLifetime(license.getExpiresAt() == null);
        return resp;
    }

    // ── Validate: check license is still valid (periodic heartbeat) ───────────
    @Transactional
    public LicenseDto.ActivateResponse validate(LicenseDto.ValidateRequest req) {
        License license = licenseRepository.findByLicenseKey(req.getLicenseKey())
                .orElseThrow(() -> new IllegalArgumentException("Invalid license key"));

        if (license.getStatus() == License.Status.REVOKED)
            throw new IllegalStateException("License has been revoked");
        if (license.isExpired()) {
            license.setStatus(License.Status.EXPIRED);
            licenseRepository.save(license);
            throw new IllegalStateException("License has expired");
        }
        if (req.getMachineId() != null && license.isBoundToMachine()
                && !license.matchesMachine(req.getMachineId())) {
            throw new IllegalStateException("License is bound to a different machine");
        }

        license.setLastCheckedAt(LocalDateTime.now());
        licenseRepository.save(license);

        Plan plan = license.getSubscription().getPlan();
        LicenseDto.ActivateResponse resp = new LicenseDto.ActivateResponse();
        resp.setSuccess(true);
        resp.setMessage("License is valid");
        resp.setLicense(LicenseDto.Response.from(license));
        resp.setPlanName(plan != null ? plan.getName() : null);
        resp.setMaxDevices(plan != null ? plan.getMaxDevices() : 0);
        resp.setUnlimitedDevices(plan != null && plan.hasUnlimitedDevices());
        resp.setExpiresAt(license.getExpiresAt());
        resp.setLifetime(license.getExpiresAt() == null);
        return resp;
    }

    // ── User: get my licenses ─────────────────────────────────────────────────
    public List<LicenseDto.Response> getUserLicenses(Long userId) {
        return licenseRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(LicenseDto.Response::from).collect(Collectors.toList());
    }

    // ── User: deactivate (unbind machine) ─────────────────────────────────────
    @Transactional
    public LicenseDto.Response deactivate(String licenseKey, Long userId) {
        License license = licenseRepository.findByLicenseKey(licenseKey)
                .orElseThrow(() -> new IllegalArgumentException("License not found"));
        if (!license.getUser().getId().equals(userId))
            throw new IllegalStateException("Access denied");

        license.setMachineId(null);
        license.setMachineLabel(null);
        license.setLastCheckedAt(null);
        return LicenseDto.Response.from(licenseRepository.save(license));
    }

    // ── Admin: get all licenses ───────────────────────────────────────────────
    public List<LicenseDto.Response> adminGetAll() {
        return licenseRepository.findAllWithDetails()
                .stream().map(LicenseDto.Response::from).collect(Collectors.toList());
    }

    // ── Admin: revoke license ─────────────────────────────────────────────────
    @Transactional
    public LicenseDto.Response adminRevoke(Long licenseId, User admin, String reason) {
        License license = licenseRepository.findById(licenseId)
                .orElseThrow(() -> new IllegalArgumentException("License not found"));
        license.setStatus(License.Status.REVOKED);
        license.setRevokedAt(LocalDateTime.now());
        license.setRevokedBy(admin);
        license.setRevokedReason(reason);
        log.info("License {} revoked by admin {} — reason: {}", license.getLicenseKey(), admin.getEmail(), reason);
        return LicenseDto.Response.from(licenseRepository.save(license));
    }

    // ── Admin: reset machine binding ──────────────────────────────────────────
    @Transactional
    public LicenseDto.Response adminResetMachine(Long licenseId) {
        License license = licenseRepository.findById(licenseId)
                .orElseThrow(() -> new IllegalArgumentException("License not found"));
        license.setMachineId(null);
        license.setMachineLabel(null);
        license.setLastCheckedAt(null);
        log.info("Machine binding reset for license {}", license.getLicenseKey());
        return LicenseDto.Response.from(licenseRepository.save(license));
    }

    // ── Admin: get activation history ─────────────────────────────────────────
    public List<LicenseDto.ActivationRecord> getActivationHistory(Long licenseId) {
        return activationRepository.findByLicenseId(licenseId)
                .stream().map(LicenseDto.ActivationRecord::from).collect(Collectors.toList());
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private void recordActivation(License license, LicenseDto.ActivateRequest req,
                                   LicenseActivation.Result result, String reason) {
        LicenseActivation act = new LicenseActivation();
        act.setLicense(license);
        act.setMachineId(req.getMachineId());
        act.setMachineLabel(req.getMachineLabel());
        act.setIpAddress(req.getIpAddress());
        act.setResult(result);
        act.setFailureReason(reason);
        activationRepository.save(act);
    }
}
