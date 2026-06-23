package com.wifiextender.repository;

import com.wifiextender.entity.ConnectedDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ConnectedDeviceRepository extends JpaRepository<ConnectedDevice, Long> {

    @Query("SELECT d FROM ConnectedDevice d WHERE d.user.id = :userId ORDER BY d.online DESC, d.lastSeen DESC")
    List<ConnectedDevice> findByUserIdOrderByLastSeenDesc(@Param("userId") Long userId);

    @Query("SELECT d FROM ConnectedDevice d WHERE d.hotspot.id = :hotspotId ORDER BY d.online DESC, d.lastSeen DESC")
    List<ConnectedDevice> findByHotspotId(@Param("hotspotId") Long hotspotId);

    Optional<ConnectedDevice> findByUserIdAndMacAddress(Long userId, String macAddress);

    @Query("SELECT d FROM ConnectedDevice d WHERE d.user.id = :userId AND d.blocked = false AND d.online = true ORDER BY d.lastSeen DESC")
    List<ConnectedDevice> findActiveByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.user.id = :userId AND d.blocked = false AND d.online = true")
    long countOnlineByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.hotspot.id = :hotspotId AND d.blocked = false AND d.online = true")
    long countActiveByHotspotId(@Param("hotspotId") Long hotspotId);

    @Modifying
    @Transactional
    @Query("UPDATE ConnectedDevice d SET d.bytesSent = d.bytesSent + :sent, d.bytesReceived = d.bytesReceived + :received, d.lastSeen = :now, d.online = true WHERE d.id = :id")
    void updateBandwidth(@Param("id") Long id, @Param("sent") Long sent, @Param("received") Long received, @Param("now") LocalDateTime now);

    /** Mark devices as offline if not seen for more than staleAfter minutes */
    @Modifying
    @Transactional
    @Query("UPDATE ConnectedDevice d SET d.online = false WHERE d.online = true AND d.lastSeen < :cutoff")
    int markStaleOffline(@Param("cutoff") LocalDateTime cutoff);

    @Query("SELECT SUM(d.bytesSent + d.bytesReceived) FROM ConnectedDevice d WHERE d.user.id = :userId")
    Long sumTotalBandwidthByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.user.id = :userId AND d.online = true")
    long countOnlineDevicesByUserId(@Param("userId") Long userId);

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.user.id = :userId AND d.blocked = true")
    long countBlockedByUserId(@Param("userId") Long userId);

    @Query("SELECT d FROM ConnectedDevice d JOIN FETCH d.user LEFT JOIN FETCH d.hotspot ORDER BY d.lastSeen DESC")
    List<ConnectedDevice> findAllWithUser();

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.online = true")
    long countAllOnline();

    @Query("SELECT COUNT(d) FROM ConnectedDevice d WHERE d.blocked = true")
    long countAllBlocked();

    @Query("SELECT d.deviceType, COUNT(d) FROM ConnectedDevice d GROUP BY d.deviceType")
    List<Object[]> countByDeviceType();

    @Query("SELECT u FROM User u WHERE EXISTS (SELECT h FROM Hotspot h WHERE h.user = u AND h.status = 'ACTIVE')")
    List<com.wifiextender.entity.User> findUsersWithActiveHotspot();

    @Modifying
    @Transactional
    @Query("DELETE FROM ConnectedDevice d WHERE d.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);
}
