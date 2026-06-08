package com.wifiextender.dto;

import com.wifiextender.entity.Plan;
import jakarta.validation.constraints.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

public class PlanDto {

    @Data
    public static class Request {
        @NotBlank(message = "Plan name is required")
        @Size(max = 100)
        private String name;

        private String description;

        @NotNull(message = "Price is required")
        @DecimalMin(value = "0.0", message = "Price must be non-negative")
        @Digits(integer = 8, fraction = 2)
        private BigDecimal price;

        private String planType = "MONTHLY";

        @Min(value = 1, message = "Duration must be at least 1 day")
        private Integer durationDays;

        @Min(value = 0)
        private Integer trialDays = 0;

        @NotNull(message = "Max devices is required")
        private Integer maxDevices;   // -1 = unlimited

        private Integer sortOrder = 0;
        private boolean popular = false;
        private String features;
    }

    @Data
    public static class Response {
        private Long id;
        private String name;
        private String description;
        private BigDecimal price;
        private String planType;
        private Integer durationDays;
        private Integer trialDays;
        private Integer maxDevices;
        private boolean unlimitedDevices;
        private boolean lifetime;
        private boolean active;
        private boolean popular;
        private Integer sortOrder;
        private List<String> featureList;
        private LocalDateTime createdAt;

        public static Response from(Plan p) {
            Response r = new Response();
            r.id               = p.getId();
            r.name             = p.getName();
            r.description      = p.getDescription();
            r.price            = p.getPrice();
            r.planType         = p.getPlanType().name();
            r.durationDays     = p.getDurationDays();
            r.trialDays        = p.getTrialDays();
            r.maxDevices       = p.getMaxDevices();
            r.unlimitedDevices = p.hasUnlimitedDevices();
            r.lifetime         = p.isLifetime();
            r.active           = p.isActive();
            r.popular          = p.isPopular();
            r.sortOrder        = p.getSortOrder();
            r.createdAt        = p.getCreatedAt();
            r.featureList      = p.getFeatures() != null
                ? Arrays.asList(p.getFeatures().split("\\|"))
                : List.of();
            return r;
        }
    }
}
