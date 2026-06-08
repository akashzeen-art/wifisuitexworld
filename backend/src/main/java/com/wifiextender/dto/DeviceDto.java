package com.wifiextender.dto;

import com.wifiextender.entity.ConnectedDevice;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

public class DeviceDto {

    @Data
    public static class ReportRequest {
        @NotBlank
        private String macAddress;
        private String deviceName;
        private String deviceType;
        private String ipAddress;
        private String vendor;
        private Integer signalStrength;
        private Long bytesSent     = 0L;
        private Long bytesReceived = 0L;
        private Long hotspotId;
    }

    @Data
    public static class BulkReportRequest {
        private List<ReportRequest> devices;
        private Long hotspotId;
    }

    @Data
    public static class BlockRequest {
        private boolean blocked;
    }

    @Data
    public static class Response {
        private Long    id;
        private Long    userId;
        private Long    hotspotId;
        private String  macAddress;
        private String  deviceName;
        private String  deviceType;
        private String  ipAddress;
        private String  vendor;
        private Integer signalStrength;
        private boolean blocked;
        private boolean online;
        private Long    bytesSent;
        private Long    bytesReceived;
        private Long    totalBytes;
        private LocalDateTime lastSeen;
        private LocalDateTime connectedAt;
        private LocalDateTime createdAt;

        public static Response from(ConnectedDevice d) {
            Response r = new Response();
            r.id             = d.getId();
            r.userId         = d.getUser().getId();
            r.hotspotId      = d.getHotspot() != null ? d.getHotspot().getId() : null;
            r.macAddress     = d.getMacAddress();
            r.deviceName     = d.getDeviceName();
            r.deviceType     = d.getDeviceType() != null ? d.getDeviceType().name() : "UNKNOWN";
            r.ipAddress      = d.getIpAddress();
            r.vendor         = d.getVendor();
            r.signalStrength = d.getSignalStrength();
            r.blocked        = d.isBlocked();
            r.online         = d.isOnline();
            r.bytesSent      = d.getBytesSent();
            r.bytesReceived  = d.getBytesReceived();
            r.totalBytes     = d.getBytesSent() + d.getBytesReceived();
            r.lastSeen       = d.getLastSeen();
            r.connectedAt    = d.getConnectedAt();
            r.createdAt      = d.getCreatedAt();
            return r;
        }
    }

    @Data
    public static class Stats {
        private long total;
        private long online;
        private long blocked;
        private long offline;
        private long totalBytesSent;
        private long totalBytesReceived;
    }

    @Data
    public static class WsEvent {
        private String   type;
        private Response device;
        private long     timestamp = System.currentTimeMillis();

        public WsEvent(String type, Response device) {
            this.type   = type;
            this.device = device;
        }
    }
}
