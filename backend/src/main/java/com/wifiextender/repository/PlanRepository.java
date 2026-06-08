package com.wifiextender.repository;

import com.wifiextender.entity.Plan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PlanRepository extends JpaRepository<Plan, Long> {

    List<Plan> findByActiveTrueOrderBySortOrderAscPriceAsc();

    Optional<Plan> findByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCase(String name);

    @Query("SELECT COUNT(s) FROM Subscription s WHERE s.plan.id = :planId AND s.status = 'ACTIVE'")
    long countActiveSubscriptions(Long planId);
}
