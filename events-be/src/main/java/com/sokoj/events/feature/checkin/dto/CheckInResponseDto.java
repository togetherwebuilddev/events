package com.sokoj.events.feature.checkin.dto;

import com.sokoj.events.feature.checkin.enums.ScanResult;
import com.sokoj.events.feature.registration.enums.AttendanceStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CheckInResponseDto {

    private boolean success;
    private ScanResult result;
    private String message;

    private Long registrationId;
    private Long eventId;
    private String eventName;

    private Long guestId;
    private String guestFirstName;
    private String guestLastName;
    private String guestEmail;

    private AttendanceStatus attendanceStatus;
    private LocalDateTime checkedInAt;
    private String checkedInBy;
}