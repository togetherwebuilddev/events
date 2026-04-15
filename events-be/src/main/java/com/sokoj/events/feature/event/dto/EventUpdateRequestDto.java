package com.sokoj.events.feature.event.dto;

import com.sokoj.events.feature.event.enums.EventStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventUpdateRequestDto {

    @NotBlank(message = "event.name.required")
    @Size(max = 255, message = "event.name.size")
    private String name;

    @NotBlank(message = "event.slug.required")
    @Size(max = 255, message = "event.slug.size")
    private String slug;

    private String description;

    @Size(max = 255, message = "event.location.size")
    private String location;

    @NotNull(message = "event.startTime.required")
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    @NotNull(message = "event.status.required")
    private EventStatus status;

    private Integer capacity;

    private String notes;
}