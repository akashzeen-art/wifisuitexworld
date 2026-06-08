package com.wifiextender.service;

import com.wifiextender.dto.DeviceDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Broadcasts device events to WebSocket subscribers.
 *
 * Topics:
 *   /topic/devices/{userId}          — full device list refresh
 *   /topic/devices/{userId}/event    — single device change event
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceEventPublisher {

    private final SimpMessagingTemplate messaging;

    public void publishList(Long userId, List<DeviceDto.Response> devices) {
        messaging.convertAndSend("/topic/devices/" + userId, devices);
    }

    public void publishEvent(Long userId, String eventType, DeviceDto.Response device) {
        DeviceDto.WsEvent event = new DeviceDto.WsEvent(eventType, device);
        messaging.convertAndSend("/topic/devices/" + userId + "/event", event);
    }
}
