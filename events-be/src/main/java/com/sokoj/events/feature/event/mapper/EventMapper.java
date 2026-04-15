package com.sokoj.events.feature.event.mapper;

import com.sokoj.events.feature.event.dto.EventAdminDetailsDto;
import com.sokoj.events.feature.event.dto.EventAdminListDto;
import com.sokoj.events.feature.event.dto.EventCreateRequestDto;
import com.sokoj.events.feature.event.dto.EventUpdateRequestDto;
import com.sokoj.events.feature.event.entity.Event;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {

    public Event toEntity(EventCreateRequestDto dto) {
        Event event = new Event();
        event.setName(dto.getName());
        event.setSlug(dto.getSlug());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setStatus(dto.getStatus());
        event.setCapacity(dto.getCapacity());
        event.setNotes(dto.getNotes());
        return event;
    }

    public void updateEntity(Event event, EventUpdateRequestDto dto) {
        event.setName(dto.getName());
        event.setSlug(dto.getSlug());
        event.setDescription(dto.getDescription());
        event.setLocation(dto.getLocation());
        event.setStartTime(dto.getStartTime());
        event.setEndTime(dto.getEndTime());
        event.setStatus(dto.getStatus());
        event.setCapacity(dto.getCapacity());
        event.setNotes(dto.getNotes());
    }

    public EventAdminListDto toListDto(Event event) {
        EventAdminListDto dto = new EventAdminListDto();
        dto.setId(event.getId());
        dto.setName(event.getName());
        dto.setSlug(event.getSlug());
        dto.setLocation(event.getLocation());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setStatus(event.getStatus());
        dto.setCapacity(event.getCapacity());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        return dto;
    }

    public EventAdminDetailsDto toDetailsDto(Event event) {
        EventAdminDetailsDto dto = new EventAdminDetailsDto();
        dto.setId(event.getId());
        dto.setName(event.getName());
        dto.setSlug(event.getSlug());
        dto.setDescription(event.getDescription());
        dto.setLocation(event.getLocation());
        dto.setStartTime(event.getStartTime());
        dto.setEndTime(event.getEndTime());
        dto.setStatus(event.getStatus());
        dto.setCapacity(event.getCapacity());
        dto.setNotes(event.getNotes());
        dto.setCreatedAt(event.getCreatedAt());
        dto.setUpdatedAt(event.getUpdatedAt());
        return dto;
    }
}