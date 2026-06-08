package com.wifiextender.repository;

import com.wifiextender.entity.Hotspot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

public interface HotspotRepository extends JpaRepository<Hotspot, Long> {

    List<Hotspot> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Query("SELECT h FROM Hotspot h WHERE h.user.id = :userId AND h.status = 'ACTIVE'")
    Optional<Hotspot> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(h) FROM Hotspot h WHERE h.status = 'ACTIVE'")
    long countAllActive();

    @Query("SELECT h FROM Hotspot h JOIN FETCH h.user ORDER BY h.createdAt DESC")
    List<Hotspot> findAllWithUser();

    @Query("SELECT h FROM Hotspot h JOIN FETCH h.user WHERE h.status = 'ACTIVE'")
    List<Hotspot> findAllActiveWithUser();

    @Modifying
    @Transactional
    @Query("UPDATE Hotspot h SET h.totalBytesUp = h.totalBytesUp + :up, h.totalBytesDown = h.totalBytesDown + :down WHERE h.id = :id")
    void addBandwidth(@Param("id") Long id, @Param("up") Long up, @Param("down") Long down);
}
