package com.wifiextender;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class WifiExtenderApplication {
    public static void main(String[] args) {
        SpringApplication.run(WifiExtenderApplication.class, args);
    }
}
