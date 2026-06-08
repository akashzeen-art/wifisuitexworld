package com.wifiextender.repository;

import com.wifiextender.entity.License;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface LicenseRepository extends JpaRepository<License, Long> {

    Optional<License> findByLicenseKey(String licenseKey);

    @Query("SELECT l FROM License l JOIN FETCH l.user JOIN FETCH l.subscription JOIN FETCH l.subscription.plan WHERE l.user.id = :userId ORDER BY l.createdAt DESC")
    List<License> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    @Query("SELECT l FROM License l JOIN FETCH l.user JOIN FETCH l.subscription JOIN FETCH l.subscription.plan WHERE l.user.id = :userId AND l.status = 'ACTIVE' ORDER BY l.expiresAt DESC NULLS LAST")
    Optional<License> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT l FROM License l JOIN FETCH l.user JOIN FETCH l.subscription JOIN FETCH l.subscription.plan ORDER BY l.createdAt DESC")
    List<License> findAllWithDetails();

    @Query("SELECT l FROM License l WHERE l.subscription.id = :subscriptionId")
    List<License> findBySubscriptionId(@Param("subscriptionId") Long subscriptionId);

    @Query("SELECT l FROM License l WHERE l.machineId = :machineId AND l.status = 'ACTIVE'")
    List<License> findActiveByMachineId(@Param("machineId") String machineId);

    boolean existsByLicenseKey(String licenseKey);

    @Modifying
    @Transactional
    @Query("UPDATE License l SET l.status = 'EXPIRED', l.updatedAt = :now WHERE l.status = 'ACTIVE' AND l.expiresAt IS NOT NULL AND l.expiresAt < :now")
    int expireOverdueLicenses(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(l) FROM License l WHERE l.status = 'ACTIVE'")
    long countActive();

    @Query("SELECT COUNT(l) FROM License l WHERE l.status = 'REVOKED'")
    long countRevoked();

    @Query("SELECT COUNT(l) FROM License l WHERE l.machineId IS NOT NULL")
    long countActivated();
}
