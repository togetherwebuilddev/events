package com.sokoj.events.feature.guest.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class GuestAdminDetailsDto {

    private Long id;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String companyName;
    private String notes;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}