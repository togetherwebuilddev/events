package com.sokoj.events.feature.guest.service;

import com.sokoj.events.exception.ConflictException;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.checkin.repository.CheckInLogRepository;
import com.sokoj.events.feature.guest.dto.GuestAdminDetailsDto;
import com.sokoj.events.feature.guest.dto.GuestAdminListDto;
import com.sokoj.events.feature.guest.dto.GuestCreateRequestDto;
import com.sokoj.events.feature.guest.dto.GuestUpdateRequestDto;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.guest.mapper.GuestMapper;
import com.sokoj.events.feature.guest.repository.GuestRepository;
import com.sokoj.events.feature.notification.email.repository.EmailLogRepository;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;
    private final GuestMapper guestMapper;
    private final EventRegistrationRepository registrationRepository;
    private final EmailLogRepository emailLogRepository;
    private final CheckInLogRepository checkInLogRepository;

    @Transactional
    public GuestAdminDetailsDto create(GuestCreateRequestDto request) {
        Guest guest = guestMapper.toEntity(request);
        Guest saved = guestRepository.save(guest);
        return guestMapper.toDetailsDto(saved);
    }

    @Transactional(readOnly = true)
    public List<GuestAdminListDto> findAll() {
        return guestRepository.findAll()
                .stream()
                .map(guestMapper::toListDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuestAdminDetailsDto findById(Long id) {
        Guest guest = getGuestById(id);
        return guestMapper.toDetailsDto(guest);
    }

    @Transactional
    public GuestAdminDetailsDto update(Long id, GuestUpdateRequestDto request) {
        Guest guest = getGuestById(id);
        guestMapper.updateEntity(guest, request);
        Guest updated = guestRepository.save(guest);
        return guestMapper.toDetailsDto(updated);
    }

    @Transactional
    public void delete(Long id) {
        Guest guest = getGuestById(id);
        if (registrationRepository.existsByGuestId(guest.getId())) {
            throw new ConflictException(MessageConstants.GUEST_DELETE_BLOCKED_HISTORY);
        }
        guestRepository.delete(guest);
    }

    private Guest getGuestById(Long id) {
        return guestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(MessageConstants.GUEST_NOT_FOUND));
    }
}
