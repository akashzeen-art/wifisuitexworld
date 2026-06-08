package com.wifiextender.dto;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class BandwidthDto {

    @Data
    public static class HourlyPoint {
        private LocalDateTime hour;
        private Long bytesUp;
        private Long bytesDown;
        private Long total;
    }

    @Data
    public static class Summary {
        private Long totalBytesUp;
        private Long totalBytesDown;
        private Long totalBytes;
        private List<HourlyPoint> hourly;
    }
}
