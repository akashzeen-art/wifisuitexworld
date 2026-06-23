package com.wifiextender.config;

import com.wifiextender.entity.Plan;
import com.wifiextender.entity.User;
import com.wifiextender.repository.PlanRepository;
import com.wifiextender.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String UNLIMITED_PLAN = "Unlimited Monthly";

    private final UserRepository  userRepository;
    private final PlanRepository  planRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        seedAdmin();
        seedUnlimitedPlan();
    }

    private void seedAdmin() {
        userRepository.findByEmail("admin@wifiextender.com").ifPresentOrElse(
            admin -> {
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setActive(true);
                admin.setFailedAttempts(0);
                admin.setLockedUntil(null);
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                log.info("Admin password reset on startup");
            },
            () -> {
                User admin = new User();
                admin.setName("Admin");
                admin.setEmail("admin@wifiextender.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                log.info("Seeded admin: admin@wifiextender.com / admin123");
            }
        );
    }

    private void seedUnlimitedPlan() {
        planRepository.findAll().forEach(p -> {
            if (!UNLIMITED_PLAN.equalsIgnoreCase(p.getName())) {
                p.setActive(false);
                planRepository.save(p);
            }
        });

        Plan plan = planRepository.findByNameIgnoreCase(UNLIMITED_PLAN).orElseGet(Plan::new);
        plan.setName(UNLIMITED_PLAN);
        plan.setDescription("Unlimited devices, full WiFi extender features, renewed every 30 days.");
        plan.setPrice(new BigDecimal("9.99"));
        plan.setPlanType(Plan.PlanType.MONTHLY);
        plan.setDurationDays(30);
        plan.setTrialDays(0);
        plan.setMaxDevices(-1);
        plan.setSortOrder(1);
        plan.setPopular(true);
        plan.setActive(true);
        plan.setFeatures("Unlimited devices|30-day license|Full device monitoring|Device blocking|Bandwidth tracking|Hotspot management|Priority support");
        planRepository.save(plan);
        log.info("Unlimited Monthly plan ready");
    }
}
