package com.sokoj.events.feature.notification.email.dto;

import lombok.Data;

@Data
public class EmailPreviewDto {

    private Long registrationId;
    private String emailTo;
    private String subject;
    private String body;
}