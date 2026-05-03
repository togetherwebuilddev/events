package com.sokoj.events.feature.notification.email.dto;

import lombok.Data;

import java.util.List;

@Data
public class BulkEmailSendResultDto {

    private boolean success;
    private String message;
    private int totalRequested;
    private int successCount;
    private int skippedCount;
    private int failedCount;
    private List<EmailSendResultDto> results;
}
