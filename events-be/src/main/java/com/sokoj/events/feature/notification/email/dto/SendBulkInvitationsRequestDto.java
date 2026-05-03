package com.sokoj.events.feature.notification.email.dto;

import com.sokoj.events.feature.notification.email.enums.EmailType;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SendBulkInvitationsRequestDto {

    @NotEmpty(message = "email.registrationIds.required")
    private List<Long> registrationIds;

    @Size(max = 255, message = "email.subject.size")
    private String subject;

    @Size(max = 5000, message = "email.body.size")
    private String body;

    private EmailType emailType;
}
