package com.sokoj.events.feature.notification.email.dto;

import com.sokoj.events.feature.notification.email.enums.EmailType;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SendInvitationRequestDto {

    @NotNull(message = "email.registrationId.required")
    private Long registrationId;

    @Size(max = 255, message = "email.subject.size")
    private String subject;

    private EmailType emailType;
}