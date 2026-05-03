package com.sokoj.events.feature.registration.service;

import com.sokoj.events.exception.ConflictException;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.event.repository.EventRepository;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.guest.repository.GuestRepository;
import com.sokoj.events.feature.checkin.repository.CheckInLogRepository;
import com.sokoj.events.feature.notification.email.entity.EmailLog;
import com.sokoj.events.feature.notification.email.repository.EmailLogRepository;
import com.sokoj.events.feature.registration.dto.RegistrationAdminDetailsDto;
import com.sokoj.events.feature.registration.dto.RegistrationAdminListDto;
import com.sokoj.events.feature.registration.dto.RegistrationCreateRequestDto;
import com.sokoj.events.feature.registration.dto.RegistrationUpdateRequestDto;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import com.sokoj.events.feature.registration.mapper.RegistrationMapper;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private final EventRegistrationRepository registrationRepository;
    private final EventRepository eventRepository;
    private final GuestRepository guestRepository;
    private final RegistrationMapper registrationMapper;
    private final EmailLogRepository emailLogRepository;
    private final CheckInLogRepository checkInLogRepository;

    @Transactional
    public RegistrationAdminDetailsDto create(RegistrationCreateRequestDto request) {
        Event event = eventRepository.findById(request.getEventId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.EVENT_NOT_FOUND));

        Guest guest = guestRepository.findById(request.getGuestId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.GUEST_NOT_FOUND));

        Optional<EventRegistration> existingRegistration =
                registrationRepository.findByEventIdAndGuestId(event.getId(), guest.getId());

        if (existingRegistration.isPresent()) {
            EventRegistration registration = existingRegistration.get();

            if (registration.getCanceledAt() != null) {
                registration.setCanceledAt(null);
                registration.setAttendanceStatus(com.sokoj.events.feature.registration.enums.AttendanceStatus.NOT_ARRIVED);
                registration.setInvitationStatus(com.sokoj.events.feature.registration.enums.InvitationStatus.PENDING);
                registration.setInvitationSentAt(null);
                registration.setCheckedInAt(null);
                registration.setCheckedInBy(null);
                registration.setManualCheckInReason(null);
                registration.setNotes(request.getNotes());

                EventRegistration reactivated = registrationRepository.save(registration);
                return registrationMapper.toDetailsDto(reactivated);
            }

            throw new ConflictException(MessageConstants.REGISTRATION_ALREADY_EXISTS);
        }

        EventRegistration registration = registrationMapper.toEntity(request);
        registration.setEvent(event);
        registration.setGuest(guest);
        EventRegistration saved = saveWithUniqueQrToken(registration, event.getId());
        return registrationMapper.toDetailsDto(saved);
    }

    @Transactional(readOnly = true)
    public List<RegistrationAdminListDto> findAll() {
        return registrationRepository.findAll()
                .stream()
                .map(registration -> {
                    RegistrationAdminListDto dto = registrationMapper.toListDto(registration);
                    enrichInvitationError(dto, registration.getId());
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public RegistrationAdminDetailsDto findById(Long id) {
        EventRegistration registration = getRegistrationById(id);
        RegistrationAdminDetailsDto dto = registrationMapper.toDetailsDto(registration);
        enrichInvitationError(dto, registration.getId());
        return dto;
    }

    @Transactional
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

    @Transactional
    public void delete(Long id) {
        cancel(id);
    }

    @Transactional
    public void cancel(Long id) {
        EventRegistration registration = getRegistrationById(id);
        registration.setCanceledAt(LocalDateTime.now());
        registration.setAttendanceStatus(com.sokoj.events.feature.registration.enums.AttendanceStatus.NOT_ARRIVED);
        registration.setCheckedInAt(null);
        registration.setCheckedInBy(null);
        registration.setManualCheckInReason(null);
        registrationRepository.save(registration);
    }

    private EventRegistration getRegistrationById(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));
    }

    private EventRegistration saveWithUniqueQrToken(EventRegistration registration, Long eventId) {
        for (int attempt = 0; attempt < 5; attempt++) {
            registration.setQrToken(generateUniqueQrToken(eventId));
            try {
                return registrationRepository.save(registration);
            } catch (DataIntegrityViolationException ex) {
                if (attempt == 4) {
                    throw new ConflictException(MessageConstants.QR_TOKEN_ALREADY_EXISTS);
                }
            }
        }

        throw new ConflictException(MessageConstants.QR_TOKEN_ALREADY_EXISTS);
    }

    private String generateUniqueQrToken(Long eventId) {
        String token;

        do {
            token = "EVT-" + eventId + "-" + UUID.randomUUID();
        } while (registrationRepository.existsByQrToken(token));

        return token;
    }

    private void enrichInvitationError(RegistrationAdminListDto dto, Long registrationId) {
        emailLogRepository.findFirstByRegistration_IdOrderByCreatedAtDesc(registrationId)
                .map(EmailLog::getErrorMessage)
                .ifPresent(dto::setInvitationErrorMessage);
    }

    private void enrichInvitationError(RegistrationAdminDetailsDto dto, Long registrationId) {
        emailLogRepository.findFirstByRegistration_IdOrderByCreatedAtDesc(registrationId)
                .map(EmailLog::getErrorMessage)
                .ifPresent(dto::setInvitationErrorMessage);
    }
}
