package com.sokoj.events.feature.registration.dto;

import com.sokoj.events.feature.registration.enums.AttendanceStatus;
import com.sokoj.events.feature.registration.enums.InvitationStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationUpdateRequestDto {

    @NotNull(message = "registration.invitationStatus.required")
    private InvitationStatus invitationStatus;

    @NotNull(message = "registration.attendanceStatus.required")
    private AttendanceStatus attendanceStatus;

    @Size(max = 255, message = "registration.checkedInBy.size")
    private String checkedInBy;

    @Size(max = 255, message = "registration.manualCheckInReason.size")
    private String manualCheckInReason;

    @Size(max = 500, message = "registration.notes.size")
    private String notes;
}