package com.sokoj.events.feature.registration.service;

import com.sokoj.events.exception.ConflictException;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.event.repository.EventRepository;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.guest.repository.GuestRepository;
import com.sokoj.events.feature.registration.dto.RegistrationAdminDetailsDto;
import com.sokoj.events.feature.registration.dto.RegistrationAdminListDto;
import com.sokoj.events.feature.registration.dto.RegistrationCreateRequestDto;
import com.sokoj.events.feature.registration.dto.RegistrationUpdateRequestDto;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import com.sokoj.events.feature.registration.mapper.RegistrationMapper;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final EventRegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;
    private final RegistrationMapper registrationMapper;

    public RegistrationAdminDetailsDto create(RegistrationCreateRequestDto request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.EVENT_NOT_FOUND));

        Guest guest = guestRepository.findById(request.getGuestId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.GUEST_NOT_FOUND));

        if (registrationRepository.existsByEventIdAndGuestId(event.getId(), guest.getId())) {
            throw new ConflictException(MessageConstants.REGISTRATION_ALREADY_EXISTS);
        }

        EventRegistration registration = registrationMapper.toEntity(request);
        registration.setEvent(event);
        registration.setGuest(guest);
        registration.setQrToken(generateUniqueQrToken());

        EventRegistration saved = registrationRepository.save(registration);
        return registrationMapper.toDetailsDto(saved);
    }

    public List<RegistrationAdminListDto> findAll() {
        return registrationRepository.findAll()
                .stream()
                .map(registrationMapper::toListDto)
                .toList();
    }

    public RegistrationAdminDetailsDto findById(Long id) {
        EventRegistration registration = getRegistrationById(id);
        return registrationMapper.toDetailsDto(registration);
    }

    public RegistrationAdminDetailsDto update(Long id, RegistrationUpdateRequestDto request) {
        EventRegistration registration = getRegistrationById(id);

        registrationMapper.updateEntity(registration, request);

        if (request.getAttendanceStatus() != null
                && (request.getAttendanceStatus().name().equals("CHECKED_IN")
                || request.getAttendanceStatus().name().equals("MANUAL_CHECKED_IN"))
                && registration.getCheckedInAt() == null) {
            registration.setCheckedInAt(LocalDateTime.now());
        }

        EventRegistration updated = registrationRepository.save(registration);
        return registrationMapper.toDetailsDto(updated);
    }

    public void delete(Long id) {
        EventRegistration registration = getRegistrationById(id);
        registrationRepository.delete(registration);
    }

    private EventRegistration getRegistrationById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));
    }

    private String generateUniqueQrToken() {
        String token;

        do {
            token = UUID.randomUUID().toString();
        } while (registrationRepository.existsByQrToken(token));

        return token;
    }
}