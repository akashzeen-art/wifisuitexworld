package com.wifiextender.service;

import com.wifiextender.repository.LicenseRepository;
import com.wifiextender.repository.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class SubscriptionScheduler {

    private final SubscriptionRepository subscriptionRepository;
    private final LicenseRepository      licenseRepository;

    /** Runs every hour — marks overdue subscriptions and licenses as EXPIRED */
    @Scheduled(fixedRate = 3_600_000)
    @Transactional
    public void expireOverdue() {
        LocalDateTime now = LocalDateTime.now();
        int subs     = subscriptionRepository.expireOverdue(now);
        int licenses = licenseRepository.expireOverdueLicenses(now);
        if (subs > 0 || licenses > 0) {
            log.info("Expired {} subscriptions and {} licenses", subs, licenses);
        }
    }
}
