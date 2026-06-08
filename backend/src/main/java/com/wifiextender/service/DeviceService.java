package com.wifiextender.service;

import com.wifiextender.dto.DeviceDto;
import com.wifiextender.entity.ConnectedDevice;
import com.wifiextender.entity.User;
import com.wifiextender.repository.ConnectedDeviceRepository;
import com.wifiextender.repository.HotspotRepository;
import com.wifiextender.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceService {

    private final ConnectedDeviceRepository deviceRepository;
    private final HotspotRepository         hotspotRepository;
    private final SubscriptionRepository    subscriptionRepository;
    private final DeviceEventPublisher      eventPublisher;

    // ── Get all devices for user ──────────────────────────────────────────────
    public List<DeviceDto.Response> getDevices(Long userId) {
        return deviceRepository.findByUserIdOrderByLastSeenDesc(userId)
                .stream().map(DeviceDto.Response::from).collect(Collectors.toList());
    }

    // ── Get device stats ──────────────────────────────────────────────────────
    public DeviceDto.Stats getStats(Long userId) {
        List<ConnectedDevice> all = deviceRepository.findByUserIdOrderByLastSeenDesc(userId);
        DeviceDto.Stats stats = new DeviceDto.Stats();
        stats.setTotal(all.size());
        stats.setOnline(all.stream().filter(d -> d.isOnline() && !d.isBlocked()).count());
        stats.setBlocked(all.stream().filter(ConnectedDevice::isBlocked).count());
        stats.setOffline(all.stream().filter(d -> !d.isOnline() && !d.isBlocked()).count());
        stats.setTotalBytesSent(all.stream().mapToLong(d -> d.getBytesSent() != null ? d.getBytesSent() : 0).sum());
        stats.setTotalBytesReceived(all.stream().mapToLong(d -> d.getBytesReceived() != null ? d.getBytesReceived() : 0).sum());
        return stats;
    }

    // ── Report single device (upsert) ─────────────────────────────────────────
    @Transactional
    public DeviceDto.Response reportDevice(User user, DeviceDto.ReportRequest req) {
        boolean isNew = false;
        ConnectedDevice device = deviceRepository
                .findByUserIdAndMacAddress(user.getId(), req.getMacAddress())
                .orElseGet(() -> { return new ConnectedDevice(); });

        isNew = device.getId() == null;

        device.setUser(user);
        device.setMacAddress(req.getMacAddress().toUpperCase());
        device.setDeviceName(req.getDeviceName() != null ? req.getDeviceName() : "Unknown Device");
        device.setIpAddress(req.getIpAddress());
        device.setVendor(req.getVendor());
        device.setOnline(true);
        device.setLastSeen(LocalDateTime.now());

        if (req.getSignalStrength() != null)
            device.setSignalStrength(req.getSignalStrength());

        if (req.getBytesSent() != null)     device.setBytesSent(req.getBytesSent());
        if (req.getBytesReceived() != null) device.setBytesReceived(req.getBytesReceived());

        if (req.getDeviceType() != null) {
            try {
                device.setDeviceType(ConnectedDevice.DeviceType.valueOf(req.getDeviceType().toUpperCase()));
            } catch (IllegalArgumentException ignored) {
                device.setDeviceType(ConnectedDevice.DeviceType.UNKNOWN);
            }
        }

        if (req.getHotspotId() != null)
            hotspotRepository.findById(req.getHotspotId()).ifPresent(device::setHotspot);

        ConnectedDevice saved = deviceRepository.save(device);
        DeviceDto.Response response = DeviceDto.Response.from(saved);

        // Publish WebSocket event
        eventPublisher.publishEvent(user.getId(), isNew ? "CONNECTED" : "UPDATED", response);
        eventPublisher.publishList(user.getId(), getDevices(user.getId()));

        return response;
    }

    // ── Bulk report (desktop app sends all devices at once) ───────────────────
    @Transactional
    public List<DeviceDto.Response> bulkReport(User user, DeviceDto.BulkReportRequest req) {
        if (req.getDevices() == null || req.getDevices().isEmpty())
            return List.of();

        // Check device limit
        checkDeviceLimit(user, req.getDevices().size());

        List<DeviceDto.Response> results = new ArrayList<>();
        for (DeviceDto.ReportRequest device : req.getDevices()) {
            if (req.getHotspotId() != null) device.setHotspotId(req.getHotspotId());
            results.add(reportDevice(user, device));
        }

        // Publish full list after bulk update
        eventPublisher.publishList(user.getId(), getDevices(user.getId()));
        return results;
    }

    // ── Toggle block ──────────────────────────────────────────────────────────
    @Transactional
    public DeviceDto.Response toggleBlock(Long deviceId, Long userId) {
        ConnectedDevice device = deviceRepository.findById(deviceId)
                .orElseThrow(() -> new IllegalArgumentException("Device not found"));
        if (!device.getUser().getId().equals(userId))
            throw new IllegalStateException("Access denied");

        device.setBlocked(!device.isBlocked());
        ConnectedDevice saved = deviceRepository.save(device);
        DeviceDto.Response response = DeviceDto.Response.from(saved);

        String eventType = saved.isBlocked() ? "BLOCKED" : "UNBLOCKED";
        eventPublisher.publishEvent(userId, eventType, response);
        eventPublisher.publishList(userId, getDevices(userId));

        return response;
    }

    // ── Mark device offline ───────────────────────────────────────────────────
    @Transactional
    public void markOffline(Long deviceId, Long userId) {
        deviceRepository.findById(deviceId).ifPresent(d -> {
            if (d.getUser().getId().equals(userId)) {
                d.setOnline(false);
                ConnectedDevice saved = deviceRepository.save(d);
                eventPublisher.publishEvent(userId, "DISCONNECTED", DeviceDto.Response.from(saved));
                eventPublisher.publishList(userId, getDevices(userId));
            }
        });
    }

    // ── Device limit check ────────────────────────────────────────────────────
    public void checkDeviceLimit(User user, int incomingCount) {
        var subOpt = subscriptionRepository.findActiveByUserId(user.getId());
        if (subOpt.isEmpty()) {
            throw new IllegalStateException("UPGRADE_REQUIRED: No active subscription. Please subscribe to a plan.");
        }
        var sub = subOpt.get();
        if (sub.getPlan().hasUnlimitedDevices()) return;
        long current = deviceRepository.countOnlineByUserId(user.getId());
        if (current + incomingCount > sub.getPlan().getMaxDevices()) {
            throw new IllegalStateException(
                "UPGRADE_REQUIRED: Device limit reached. Your " + sub.getPlan().getName() +
                " plan allows only " + sub.getPlan().getMaxDevices() + " device(s). " +
                "Please upgrade your plan to connect more devices."
            );
        }
    }
}
