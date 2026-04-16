package com.sokoj.events.feature.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CheckInScanRequestDto {

    @NotBlank(message = "checkin.token.required")
    @Size(max = 255, message = "checkin.token.size")
    private String token;

    @Size(max = 255, message = "checkin.scannedBy.size")
    private String scannedBy;

    @Size(max = 255, message = "checkin.deviceInfo.size")
    private String deviceInfo;
}