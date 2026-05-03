package com.sokoj.events.feature.checkin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CheckInManualRequestDto {

    @NotNull(message = "checkin.registrationId.required")
    private Long registrationId;

    @Size(max = 255, message = "checkin.scannedBy.size")
    private String scannedBy;

    @NotBlank(message = "checkin.manualReason.required")
    @Size(max = 255, message = "checkin.manualReason.size")
    private String manualReason;

    @Size(max = 255, message = "checkin.deviceInfo.size")
    private String deviceInfo;
}