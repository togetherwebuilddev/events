package com.sokoj.events.feature.notification.email.dto;

import com.sokoj.events.feature.notification.email.enums.EmailStatus;
import com.sokoj.events.feature.notification.email.enums.EmailType;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EmailLogDto {

    private Long id;

    private Long eventId;
    private Long registrationId;
    private Long guestId;

    private String emailTo;
    private String subject;

    private EmailType emailType;
    private EmailStatus status;

    private String errorMessage;
    private LocalDateTime sentAt;
    private LocalDateTime createdAt;
}