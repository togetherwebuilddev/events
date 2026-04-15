package com.sokoj.events.feature.event.service;

import com.sokoj.events.exception.ConflictException;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.event.dto.EventAdminDetailsDto;
import com.sokoj.events.feature.event.dto.EventAdminListDto;
import com.sokoj.events.feature.event.dto.EventCreateRequestDto;
import com.sokoj.events.feature.event.dto.EventUpdateRequestDto;
import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.event.mapper.EventMapper;
import com.sokoj.events.feature.event.repository.EventRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class EventService {

    private final EventRepository eventRepository;
    private final EventMapper eventMapper;

    public EventAdminDetailsDto create(EventCreateRequestDto request) {
        if (eventRepository.existsBySlug(request.getSlug())) {
            throw new ConflictException("event.slug.exists");
        }

        Event event = eventMapper.toEntity(request);
        Event saved = eventRepository.save(event);

        return eventMapper.toDetailsDto(saved);
    }

    public List<EventAdminListDto> findAll() {
        return eventRepository.findAll()
                .stream()
                .map(eventMapper::toListDto)
                .toList();
    }

    public EventAdminDetailsDto findById(Long id) {
        Event event = getEventById(id);
        return eventMapper.toDetailsDto(event);
    }

    public EventAdminDetailsDto update(Long id, EventUpdateRequestDto request) {
        Event event = getEventById(id);

        if (!event.getSlug().equals(request.getSlug())
                && eventRepository.existsBySlug(request.getSlug())) {
            throw new ConflictException(MessageConstants.EVENT_SLUG_EXISTS);
        }

        eventMapper.updateEntity(event, request);
        Event updated = eventRepository.save(event);

        return eventMapper.toDetailsDto(updated);
    }

    public void delete(Long id) {
        Event event = getEventById(id);
        eventRepository.delete(event);
    }

    private Event getEventById(Long id) {
        return eventRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(MessageConstants.EVENT_NOT_FOUND));
    }
}