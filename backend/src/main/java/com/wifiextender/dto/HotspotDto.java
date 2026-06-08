package com.wifiextender.dto;

import com.wifiextender.entity.Hotspot;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.time.LocalDateTime;

public class HotspotDto {

    @Data
    @Schema(description = "Create hotspot request")
    public static class CreateRequest {
        @NotBlank(message = "SSID is required")
        @Size(min = 1, max = 32, message = "SSID must be 1–32 characters")
        private String ssid;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Hotspot password must be at least 8 characters")
        private String password;

        @Min(1) @Max(50)
        private Integer maxClients = 10;

        private Long licenseId;
    }

    @Data
    @Schema(description = "Update hotspot request — all fields optional")
    public static class UpdateRequest {
        @Size(min = 1, max = 32)
        private String ssid;

        @Size(min = 8)
        private String password;

        @Min(1) @Max(50)
        private Integer maxClients;
    }

    @Data
    @Schema(description = "Hotspot response")
    public static class Response {
        private Long   id;
        private Long   userId;
        private String userName;
        private String ssid;
        private String status;
        private Integer maxClients;
        private Long   connectedDevices;
        private Long   totalBytesUp;
        private Long   totalBytesDown;
        private LocalDateTime startedAt;
        private LocalDateTime stoppedAt;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        public static Response from(Hotspot h) {
            Response r = new Response();
            r.id             = h.getId();
            r.userId         = h.getUser().getId();
            r.userName       = h.getUser().getName();
            r.ssid           = h.getSsid();
            r.status         = h.getStatus().name();
            r.maxClients     = h.getMaxClients();
            r.totalBytesUp   = h.getTotalBytesUp();
            r.totalBytesDown = h.getTotalBytesDown();
            r.startedAt      = h.getStartedAt();
            r.stoppedAt      = h.getStoppedAt();
            r.createdAt      = h.getCreatedAt();
            r.updatedAt      = h.getUpdatedAt();
            return r;
        }
    }
}
