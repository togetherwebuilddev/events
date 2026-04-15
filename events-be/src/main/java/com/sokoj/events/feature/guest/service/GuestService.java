package com.sokoj.events.feature.guest.service;

import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.guest.dto.GuestAdminDetailsDto;
import com.sokoj.events.feature.guest.dto.GuestAdminListDto;
import com.sokoj.events.feature.guest.dto.GuestCreateRequestDto;
import com.sokoj.events.feature.guest.dto.GuestUpdateRequestDto;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.guest.mapper.GuestMapper;
import com.sokoj.events.feature.guest.repository.GuestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GuestService {

    private final GuestRepository guestRepository;
    private final GuestMapper guestMapper;

    public GuestAdminDetailsDto create(GuestCreateRequestDto request) {
        Guest guest = guestMapper.toEntity(request);
        Guest saved = guestRepository.save(guest);
        return guestMapper.toDetailsDto(saved);
    }

    public List<GuestAdminListDto> findAll() {
        return guestRepository.findAll()
                .stream()
                .map(guestMapper::toListDto)
                .toList();
    }

    public GuestAdminDetailsDto findById(Long id) {
        Guest guest = getGuestById(id);
        return guestMapper.toDetailsDto(guest);
    }

    public GuestAdminDetailsDto update(Long id, GuestUpdateRequestDto request) {
        Guest guest = getGuestById(id);
        guestMapper.updateEntity(guest, request);
        Guest updated = guestRepository.save(guest);
        return guestMapper.toDetailsDto(updated);
    }

    public void delete(Long id) {
        Guest guest = getGuestById(id);
        guestRepository.delete(guest);
    }

    private Guest getGuestById(Long id) {
        return guestRepository.findById(id)
                .orElseThrow(() -> new NotFoundException(MessageConstants.GUEST_NOT_FOUND));
    }
}