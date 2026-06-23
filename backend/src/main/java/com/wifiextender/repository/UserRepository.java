package com.wifiextender.repository;

import com.wifiextender.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByEmailAndIdNot(String email, Long id);

    List<User> findByRole(User.Role role);

    List<User> findByActiveTrue();

    @Query("SELECT u FROM User u WHERE u.lockedUntil IS NOT NULL AND u.lockedUntil < :now")
    List<User> findExpiredLocks(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.failedAttempts = 0, u.lockedUntil = NULL WHERE u.lockedUntil < :now")
    int unlockExpiredAccounts(@Param("now") LocalDateTime now);

    @Modifying
    @Transactional
    @Query("UPDATE User u SET u.lastLogin = :now WHERE u.id = :id")
    void updateLastLogin(@Param("id") Long id, @Param("now") LocalDateTime now);

    @Query("SELECT COUNT(u) FROM User u WHERE u.role = :role")
    long countByRole(@Param("role") User.Role role);

    @Query("SELECT CAST(u.createdAt AS date), COUNT(u) FROM User u WHERE u.createdAt >= :from GROUP BY CAST(u.createdAt AS date) ORDER BY CAST(u.createdAt AS date)")
    List<Object[]> countByDay(@Param("from") LocalDateTime from);

    @Query("SELECT COUNT(u) FROM User u WHERE u.createdAt >= :from")
    long countCreatedAfter(@Param("from") LocalDateTime from);
}
