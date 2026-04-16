package com.sokoj.events.feature.checkin.mapper;

import com.sokoj.events.feature.checkin.dto.CheckInLogDto;
import com.sokoj.events.feature.checkin.dto.CheckInResponseDto;
import com.sokoj.events.feature.checkin.entity.CheckInLog;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import org.springframework.stereotype.Component;

@Component
public class CheckInMapper {

    public CheckInResponseDto toResponseDto(
            boolean success,
            String message,
            EventRegistration registration
    ) {
        CheckInResponseDto dto = new CheckInResponseDto();

        dto.setSuccess(success);
        dto.setResult(null);
        dto.setMessage(message);

        dto.setRegistrationId(registration.getId());
        dto.setEventId(registration.getEvent().getId());
        dto.setEventName(registration.getEvent().getName());

        dto.setGuestId(registration.getGuest().getId());
        dto.setGuestFirstName(registration.getGuest().getFirstName());
        dto.setGuestLastName(registration.getGuest().getLastName());
        dto.setGuestEmail(registration.getGuest().getEmail());

        dto.setAttendanceStatus(registration.getAttendanceStatus());
        dto.setCheckedInAt(registration.getCheckedInAt());
        dto.setCheckedInBy(registration.getCheckedInBy());

        return dto;
    }

    public CheckInResponseDto toResponseDto(
            boolean success,
            com.sokoj.events.feature.checkin.enums.ScanResult result,
            String message,
            EventRegistration registration
    ) {
        CheckInResponseDto dto = toResponseDto(success, message, registration);
        dto.setResult(result);
        return dto;
    }

    public CheckInLogDto toLogDto(CheckInLog log) {
        CheckInLogDto dto = new CheckInLogDto();

        dto.setId(log.getId());
        dto.setEventId(log.getEvent() != null ? log.getEvent().getId() : null);
        dto.setRegistrationId(log.getRegistration() != null ? log.getRegistration().getId() : null);
        dto.setGuestId(log.getGuest() != null ? log.getGuest().getId() : null);

        dto.setScannedToken(log.getScannedToken());
        dto.setScanResult(log.getScanResult());
        dto.setCheckInMethod(log.getCheckInMethod());

        dto.setScannedBy(log.getScannedBy());
        dto.setDeviceInfo(log.getDeviceInfo());
        dto.setMessage(log.getMessage());

        dto.setCreatedAt(log.getCreatedAt());

        return dto;
    }
}