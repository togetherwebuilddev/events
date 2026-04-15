package com.sokoj.events.feature.event.dto;

import com.sokoj.events.feature.event.enums.EventStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventAdminDetailsDto {

    private Long id;
    private String name;
    private String slug;
    private String description;
    private String location;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private EventStatus status;
    private Integer capacity;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}