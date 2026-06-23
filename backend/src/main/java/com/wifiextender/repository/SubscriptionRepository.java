package com.wifiextender.repository;

import com.wifiextender.entity.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    @Query("SELECT s FROM Subscription s JOIN FETCH s.plan JOIN FETCH s.user LEFT JOIN FETCH s.activatedBy WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    List<Subscription> findByUserIdWithPlan(@Param("userId") Long userId);

    @Query("SELECT s FROM Subscription s JOIN FETCH s.plan JOIN FETCH s.user LEFT JOIN FETCH s.activatedBy WHERE s.user.id = :userId AND s.status = 'ACTIVE' ORDER BY s.createdAt DESC")
    Optional<Subscription> findActiveByUserId(@Param("userId") Long userId);

    @Query("""
        SELECT s FROM Subscription s
        JOIN FETCH s.plan
        JOIN FETCH s.user
        WHERE s.status = :status
        ORDER BY s.createdAt DESC
        """)
    List<Subscription> findAllByStatus(@Param("status") Subscription.Status status);

    @Query("SELECT s FROM Subscription s JOIN FETCH s.plan JOIN FETCH s.user ORDER BY s.createdAt DESC")
    List<Subscription> findAllWithDetails();

    @Modifying
    @Transactional
    @Query("""
        UPDATE Subscription s SET s.status = 'EXPIRED', s.updatedAt = :now
        WHERE s.status = 'ACTIVE'
          AND s.expiresAt IS NOT NULL
          AND s.expiresAt < :now
        """)
    int expireOverdue(@Param("now") LocalDateTime now);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE'")
    long countAllActive();

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'PENDING'")
    long countAllPending();

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.status = 'ACTIVE' AND s.createdAt >= :from")
    long countActiveCreatedAfter(@Param("from") LocalDateTime from);

    @Query("SELECT CAST(s.createdAt AS date), COUNT(s) FROM Subscription s WHERE s.createdAt >= :from GROUP BY CAST(s.createdAt AS date) ORDER BY CAST(s.createdAt AS date)")
    List<Object[]> countByDay(@Param("from") LocalDateTime from);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.user.id = :userId AND s.status = 'ACTIVE'")
    long countActiveByUserId(@Param("userId") Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Subscription s WHERE s.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
