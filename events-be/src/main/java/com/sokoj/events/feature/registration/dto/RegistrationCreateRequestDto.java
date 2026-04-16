package com.sokoj.events.feature.registration.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class RegistrationCreateRequestDto {

    @NotNull(message = "registration.eventId.required")
    private Long eventId;

    @NotNull(message = "registration.guestId.required")
    private Long guestId;

    @Size(max = 500, message = "registration.notes.size")
    private String notes;
}