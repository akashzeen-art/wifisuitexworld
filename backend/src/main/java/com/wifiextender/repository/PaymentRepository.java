package com.wifiextender.repository;

import com.wifiextender.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    @Query("SELECT p FROM Payment p JOIN FETCH p.user LEFT JOIN FETCH p.subscription WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    List<Payment> findByUserIdWithDetails(@Param("userId") Long userId);

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);

    Optional<Payment> findByGatewayTxnId(String gatewayTxnId);

    @Query("SELECT p FROM Payment p JOIN FETCH p.user LEFT JOIN FETCH p.subscription ORDER BY p.createdAt DESC")
    List<Payment> findAllWithDetails();

    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.status = 'SUCCESS'")
    java.math.BigDecimal sumSuccessfulRevenue();

    @Query("SELECT COUNT(p) FROM Payment p WHERE p.status = 'SUCCESS'")
    long countSuccessful();
}
