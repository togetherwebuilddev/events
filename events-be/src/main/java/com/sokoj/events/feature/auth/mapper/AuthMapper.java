package com.sokoj.events.feature.auth.mapper;

import com.sokoj.events.feature.auth.dto.AuthUserDto;
import com.sokoj.events.feature.auth.entity.AppUser;
import org.springframework.stereotype.Component;

@Component
public class AuthMapper {

    public AuthUserDto toDto(AppUser user) {
        AuthUserDto dto = new AuthUserDto();
        dto.setId(user.getId());
        dto.setEmail(user.getEmail());
        dto.setFirstName(user.getFirstName());
        dto.setLastName(user.getLastName());
        dto.setFullName((user.getFirstName() + " " + user.getLastName()).trim());
        dto.setRole(user.getRole());
        return dto;
    }
}
