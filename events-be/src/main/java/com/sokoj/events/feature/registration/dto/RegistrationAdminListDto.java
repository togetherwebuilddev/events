package com.sokoj.events.feature.registration.dto;

import com.sokoj.events.feature.registration.enums.AttendanceStatus;
import com.sokoj.events.feature.registration.enums.InvitationStatus;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class RegistrationAdminListDto {

    private Long id;

    private Long eventId;
    private String eventName;

    private Long guestId;
    private String guestFirstName;
    private String guestLastName;
    private String guestEmail;

    private String qrToken;
    private InvitationStatus invitationStatus;
    private AttendanceStatus attendanceStatus;

    private LocalDateTime invitationSentAt;
    private LocalDateTime checkedInAt;
    private String invitationErrorMessage;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime canceledAt;
}
