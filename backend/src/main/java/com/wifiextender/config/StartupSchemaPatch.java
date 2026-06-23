package com.wifiextender.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class StartupSchemaPatch implements ApplicationRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(ApplicationArguments args) {
        addBoolColumn("notify_device_connect", true);
        addBoolColumn("notify_device_block", true);
        addBoolColumn("notify_license_expiry", true);
        addBoolColumn("notify_newsletter", false);
        log.debug("User notification columns verified");
    }

    private void addBoolColumn(String column, boolean defaultValue) {
        jdbcTemplate.execute(
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS " + column + " BOOLEAN DEFAULT " + defaultValue);
        jdbcTemplate.update(
                "UPDATE users SET " + column + " = ? WHERE " + column + " IS NULL", defaultValue);
        jdbcTemplate.execute(
                "ALTER TABLE users ALTER COLUMN " + column + " SET NOT NULL");
        jdbcTemplate.execute(
                "ALTER TABLE users ALTER COLUMN " + column + " SET DEFAULT " + defaultValue);
    }
}
