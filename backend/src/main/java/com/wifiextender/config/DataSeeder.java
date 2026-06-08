package com.wifiextender.config;

import com.wifiextender.entity.User;
import com.wifiextender.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository  userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
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
}
