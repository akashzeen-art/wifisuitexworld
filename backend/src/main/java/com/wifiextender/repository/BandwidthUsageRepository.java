package com.wifiextender.repository;

import com.wifiextender.entity.BandwidthUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface BandwidthUsageRepository extends JpaRepository<BandwidthUsage, Long> {

    @Query("SELECT b FROM BandwidthUsage b WHERE b.user.id = :userId AND b.recordedAt >= :from ORDER BY b.recordedAt ASC")
    List<BandwidthUsage> findByUserIdSince(@Param("userId") Long userId, @Param("from") LocalDateTime from);

    @Query("SELECT b FROM BandwidthUsage b WHERE b.hotspot.id = :hotspotId AND b.recordedAt >= :from ORDER BY b.recordedAt ASC")
    List<BandwidthUsage> findByHotspotIdSince(@Param("hotspotId") Long hotspotId, @Param("from") LocalDateTime from);

    @Query("SELECT b FROM BandwidthUsage b WHERE b.device.id = :deviceId ORDER BY b.recordedAt DESC")
    List<BandwidthUsage> findByDeviceId(@Param("deviceId") Long deviceId);

    @Query("SELECT SUM(b.bytesUp), SUM(b.bytesDown) FROM BandwidthUsage b WHERE b.user.id = :userId AND b.recordedAt >= :from")
    Object[] sumByUserIdSince(@Param("userId") Long userId, @Param("from") LocalDateTime from);

    @Query("""
        SELECT FUNCTION('date_trunc', 'hour', b.recordedAt) AS hour,
               SUM(b.bytesUp)   AS totalUp,
               SUM(b.bytesDown) AS totalDown
        FROM BandwidthUsage b
        WHERE b.user.id = :userId AND b.recordedAt >= :from
        GROUP BY FUNCTION('date_trunc', 'hour', b.recordedAt)
        ORDER BY hour ASC
        """)
    List<Object[]> hourlyByUserId(@Param("userId") Long userId, @Param("from") LocalDateTime from);

    void deleteByRecordedAtBefore(LocalDateTime cutoff);
}
