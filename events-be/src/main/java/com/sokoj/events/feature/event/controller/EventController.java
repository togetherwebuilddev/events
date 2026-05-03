package com.sokoj.events.feature.event.controller;

import com.sokoj.events.common.dto.PageResponseDto;
import com.sokoj.events.feature.event.dto.EventAdminDetailsDto;
import com.sokoj.events.feature.event.dto.EventAdminListDto;
import com.sokoj.events.feature.event.dto.EventCreateRequestDto;
import com.sokoj.events.feature.event.dto.EventUpdateRequestDto;
import com.sokoj.events.feature.event.service.EventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/events")
@RequiredArgsConstructor
public class EventController {

    private final EventService eventService;

    @PostMapping
    public EventAdminDetailsDto create(@Valid @RequestBody EventCreateRequestDto request) {
        return eventService.create(request);
    }

    @GetMapping
    public PageResponseDto<EventAdminListDto> findAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        return eventService.findAll(page, size, sort, direction);
    }

    @GetMapping("/{id}")
    public EventAdminDetailsDto findById(@PathVariable Long id) {
        return eventService.findById(id);
    }

    @PutMapping("/{id}")
    public EventAdminDetailsDto update(
            @PathVariable Long id,
            @Valid @RequestBody EventUpdateRequestDto request
    ) {
        return eventService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        eventService.delete(id);
    }
}