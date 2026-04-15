package com.sokoj.events.feature.guest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GuestUpdateRequestDto {

    @NotBlank(message = "guest.firstName.required")
    @Size(max = 100, message = "guest.firstName.size")
    private String firstName;

    @NotBlank(message = "guest.lastName.required")
    @Size(max = 100, message = "guest.lastName.size")
    private String lastName;

    @Size(max = 255, message = "guest.email.size")
    private String email;

    @Size(max = 50, message = "guest.phone.size")
    private String phone;

    @Size(max = 255, message = "guest.companyName.size")
    private String companyName;

    @Size(max = 500, message = "guest.notes.size")
    private String notes;
}