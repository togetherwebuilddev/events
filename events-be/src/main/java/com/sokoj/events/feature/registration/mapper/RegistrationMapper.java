package com.sokoj.events.feature.registration.mapper;

import com.sokoj.events.feature.registration.dto.RegistrationAdminDetailsDto;
import com.sokoj.events.feature.registration.dto.RegistrationAdminListDto;
import com.sokoj.events.feature.registration.dto.RegistrationCreateRequestDto;
import com.sokoj.events.feature.registration.dto.RegistrationUpdateRequestDto;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import org.springframework.stereotype.Component;

@Component
public class RegistrationMapper {

    public EventRegistration toEntity(RegistrationCreateRequestDto dto) {
        EventRegistration registration = new EventRegistration();
        registration.setNotes(dto.getNotes());
        return registration;
    }

    public void updateEntity(EventRegistration registration, RegistrationUpdateRequestDto dto) {
        registration.setInvitationStatus(dto.getInvitationStatus());
        registration.setAttendanceStatus(dto.getAttendanceStatus());
        registration.setCheckedInBy(dto.getCheckedInBy());
        registration.setManualCheckInReason(dto.getManualCheckInReason());
        registration.setNotes(dto.getNotes());
    }

    public RegistrationAdminListDto toListDto(EventRegistration registration) {
        RegistrationAdminListDto dto = new RegistrationAdminListDto();

        dto.setId(registration.getId());

        dto.setEventId(registration.getEvent().getId());
        dto.setEventName(registration.getEvent().getName());

        dto.setGuestId(registration.getGuest().getId());
        dto.setGuestFirstName(registration.getGuest().getFirstName());
        dto.setGuestLastName(registration.getGuest().getLastName());
        dto.setGuestEmail(registration.getGuest().getEmail());

        dto.setQrToken(registration.getQrToken());
        dto.setInvitationStatus(registration.getInvitationStatus());
        dto.setAttendanceStatus(registration.getAttendanceStatus());

        dto.setInvitationSentAt(registration.getInvitationSentAt());
        dto.setCheckedInAt(registration.getCheckedInAt());
        dto.setInvitationErrorMessage(null);

        dto.setCreatedAt(registration.getCreatedAt());
        dto.setUpdatedAt(registration.getUpdatedAt());
        dto.setCanceledAt(registration.getCanceledAt());

        return dto;
    }

    public RegistrationAdminDetailsDto toDetailsDto(EventRegistration registration) {
        RegistrationAdminDetailsDto dto = new RegistrationAdminDetailsDto();

        dto.setId(registration.getId());

        dto.setEventId(registration.getEvent().getId());
        dto.setEventName(registration.getEvent().getName());
        dto.setEventSlug(registration.getEvent().getSlug());

        dto.setGuestId(registration.getGuest().getId());
        dto.setGuestFirstName(registration.getGuest().getFirstName());
        dto.setGuestLastName(registration.getGuest().getLastName());
        dto.setGuestEmail(registration.getGuest().getEmail());
        dto.setGuestPhone(registration.getGuest().getPhone());

        dto.setQrToken(registration.getQrToken());
        dto.setInvitationStatus(registration.getInvitationStatus());
        dto.setAttendanceStatus(registration.getAttendanceStatus());

        dto.setInvitationSentAt(registration.getInvitationSentAt());
        dto.setCheckedInAt(registration.getCheckedInAt());
        dto.setCheckedInBy(registration.getCheckedInBy());
        dto.setManualCheckInReason(registration.getManualCheckInReason());
        dto.setInvitationErrorMessage(null);

        dto.setNotes(registration.getNotes());

        dto.setCreatedAt(registration.getCreatedAt());
        dto.setUpdatedAt(registration.getUpdatedAt());
        dto.setCanceledAt(registration.getCanceledAt());

        return dto;
    }
}
