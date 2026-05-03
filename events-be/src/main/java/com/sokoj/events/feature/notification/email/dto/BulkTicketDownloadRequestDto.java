package com.sokoj.events.feature.notification.email.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class BulkTicketDownloadRequestDto {

    @NotEmpty(message = "email.registrationIds.required")
    private List<Long> registrationIds;
}
