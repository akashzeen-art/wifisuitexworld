package com.wifiextender.service;

import com.wifiextender.config.ResourceNotFoundException;
import com.wifiextender.dto.HotspotDto;
import com.wifiextender.entity.Hotspot;
import com.wifiextender.entity.License;
import com.wifiextender.entity.User;
import com.wifiextender.repository.HotspotRepository;
import com.wifiextender.repository.LicenseRepository;
import com.wifiextender.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HotspotService {

    private final HotspotRepository      hotspotRepository;
    private final LicenseRepository      licenseRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final PasswordEncoder        passwordEncoder;

    // ── Get all hotspots for user ─────────────────────────────────────────────
    public List<HotspotDto.Response> getUserHotspots(Long userId) {
        return hotspotRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(HotspotDto.Response::from).collect(Collectors.toList());
    }

    // ── Get single hotspot ────────────────────────────────────────────────────
    public HotspotDto.Response getHotspot(Long id, Long userId) {
        Hotspot h = findOwned(id, userId);
        return HotspotDto.Response.from(h);
    }

    // ── Create hotspot ────────────────────────────────────────────────────────
    @Transactional
    public HotspotDto.Response create(User user, HotspotDto.CreateRequest req) {
        // Must have an active subscription
        subscriptionRepository.findActiveByUserId(user.getId())
                .orElseThrow(() -> new IllegalStateException("An active subscription is required to create a hotspot"));

        Hotspot hotspot = new Hotspot();
        hotspot.setUser(user);
        hotspot.setSsid(req.getSsid());
        hotspot.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        hotspot.setMaxClients(req.getMaxClients() != null ? req.getMaxClients() : 10);
        hotspot.setStatus(Hotspot.Status.STOPPED);

        if (req.getLicenseId() != null) {
            License license = licenseRepository.findById(req.getLicenseId())
                    .filter(l -> l.getUser().getId().equals(user.getId()))
                    .orElseThrow(() -> new IllegalArgumentException("License not found"));
            hotspot.setLicense(license);
        }

        return HotspotDto.Response.from(hotspotRepository.save(hotspot));
    }

    // ── Start hotspot ─────────────────────────────────────────────────────────
    @Transactional
    public HotspotDto.Response start(Long id, Long userId) {
        Hotspot hotspot = findOwned(id, userId);
        if (hotspot.getStatus() == Hotspot.Status.ACTIVE)
            throw new IllegalStateException("Hotspot is already active");

        hotspot.setStatus(Hotspot.Status.ACTIVE);
        hotspot.setStartedAt(LocalDateTime.now());
        hotspot.setStoppedAt(null);
        return HotspotDto.Response.from(hotspotRepository.save(hotspot));
    }

    // ── Stop hotspot ──────────────────────────────────────────────────────────
    @Transactional
    public HotspotDto.Response stop(Long id, Long userId) {
        Hotspot hotspot = findOwned(id, userId);
        if (hotspot.getStatus() == Hotspot.Status.STOPPED)
            throw new IllegalStateException("Hotspot is already stopped");

        hotspot.setStatus(Hotspot.Status.STOPPED);
        hotspot.setStoppedAt(LocalDateTime.now());
        return HotspotDto.Response.from(hotspotRepository.save(hotspot));
    }

    // ── Update hotspot config ─────────────────────────────────────────────────
    @Transactional
    public HotspotDto.Response update(Long id, Long userId, HotspotDto.UpdateRequest req) {
        Hotspot hotspot = findOwned(id, userId);
        if (req.getSsid()       != null) hotspot.setSsid(req.getSsid());
        if (req.getPassword()   != null) hotspot.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        if (req.getMaxClients() != null) hotspot.setMaxClients(req.getMaxClients());
        return HotspotDto.Response.from(hotspotRepository.save(hotspot));
    }

    // ── Delete hotspot ────────────────────────────────────────────────────────
    @Transactional
    public void delete(Long id, Long userId) {
        Hotspot hotspot = findOwned(id, userId);
        if (hotspot.getStatus() == Hotspot.Status.ACTIVE)
            throw new IllegalStateException("Stop the hotspot before deleting it");
        hotspotRepository.delete(hotspot);
    }

    // ── Get active hotspot ────────────────────────────────────────────────────
    public HotspotDto.Response getActive(Long userId) {
        return hotspotRepository.findActiveByUserId(userId)
                .map(HotspotDto.Response::from)
                .orElse(null);
    }

    // ── Helper ────────────────────────────────────────────────────────────────
    private Hotspot findOwned(Long id, Long userId) {
        Hotspot h = hotspotRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Hotspot", id));
        if (!h.getUser().getId().equals(userId))
            throw new IllegalStateException("Access denied");
        return h;
    }
}
