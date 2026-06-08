package com.wifiextender.service;

import com.wifiextender.repository.ConnectedDeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceCleanupScheduler {

    private final ConnectedDeviceRepository deviceRepository;

    /** Every 60 seconds — mark devices offline if not seen for 10 minutes */
    @Scheduled(fixedRate = 60_000)
    @Transactional
    public void markStaleDevicesOffline() {
        LocalDateTime cutoff = LocalDateTime.now().minusMinutes(10);
        int count = deviceRepository.markStaleOffline(cutoff);
        if (count > 0) {
            log.info("Marked {} devices as offline (stale)", count);
        }
    }
}
