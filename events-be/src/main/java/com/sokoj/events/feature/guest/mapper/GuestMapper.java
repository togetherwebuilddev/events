package com.sokoj.events.feature.guest.mapper;

import com.sokoj.events.feature.guest.dto.GuestAdminDetailsDto;
import com.sokoj.events.feature.guest.dto.GuestAdminListDto;
import com.sokoj.events.feature.guest.dto.GuestCreateRequestDto;
import com.sokoj.events.feature.guest.dto.GuestUpdateRequestDto;
import com.sokoj.events.feature.guest.entity.Guest;
import org.springframework.stereotype.Component;

@Component
public class GuestMapper {

    public Guest toEntity(GuestCreateRequestDto dto) {
        Guest guest = new Guest();
        guest.setFirstName(dto.getFirstName());
        guest.setLastName(dto.getLastName());
        guest.setEmail(dto.getEmail());
        guest.setPhone(dto.getPhone());
        guest.setCompanyName(dto.getCompanyName());
        guest.setNotes(dto.getNotes());
        return guest;
    }

    public void updateEntity(Guest guest, GuestUpdateRequestDto dto) {
        guest.setFirstName(dto.getFirstName());
        guest.setLastName(dto.getLastName());
        guest.setEmail(dto.getEmail());
        guest.setPhone(dto.getPhone());
        guest.setCompanyName(dto.getCompanyName());
        guest.setNotes(dto.getNotes());
    }

    public GuestAdminListDto toListDto(Guest guest) {
        GuestAdminListDto dto = new GuestAdminListDto();
        dto.setId(guest.getId());
        dto.setFirstName(guest.getFirstName());
        dto.setLastName(guest.getLastName());
        dto.setEmail(guest.getEmail());
        dto.setPhone(guest.getPhone());
        dto.setCompanyName(guest.getCompanyName());
        dto.setCreatedAt(guest.getCreatedAt());
        dto.setUpdatedAt(guest.getUpdatedAt());
        return dto;
    }

    public GuestAdminDetailsDto toDetailsDto(Guest guest) {
        GuestAdminDetailsDto dto = new GuestAdminDetailsDto();
        dto.setId(guest.getId());
        dto.setFirstName(guest.getFirstName());
        dto.setLastName(guest.getLastName());
        dto.setEmail(guest.getEmail());
        dto.setPhone(guest.getPhone());
        dto.setCompanyName(guest.getCompanyName());
        dto.setNotes(guest.getNotes());
        dto.setCreatedAt(guest.getCreatedAt());
        dto.setUpdatedAt(guest.getUpdatedAt());
        return dto;
    }
}