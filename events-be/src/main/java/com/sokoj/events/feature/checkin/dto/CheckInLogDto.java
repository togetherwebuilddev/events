package com.sokoj.events.feature.checkin.dto;

import com.sokoj.events.feature.checkin.enums.CheckInMethod;
import com.sokoj.events.feature.checkin.enums.ScanResult;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CheckInLogDto {

    private Long id;

    private Long eventId;
    private Long registrationId;
    private Long guestId;

    private String scannedToken;
    private ScanResult scanResult;
    private CheckInMethod checkInMethod;

    private String scannedBy;
    private String deviceInfo;
    private String message;

    private LocalDateTime createdAt;
}