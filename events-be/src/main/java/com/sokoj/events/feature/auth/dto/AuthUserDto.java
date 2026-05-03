package com.sokoj.events.feature.auth.dto;

import com.sokoj.events.feature.auth.enums.UserRole;
import lombok.Data;

@Data
public class AuthUserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String fullName;
    private UserRole role;
}
