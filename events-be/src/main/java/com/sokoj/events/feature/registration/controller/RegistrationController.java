package com.sokoj.events.feature.registration.controller;

import com.sokoj.events.feature.registration.dto.RegistrationAdminDetailsDto;
import com.sokoj.events.feature.registration.dto.RegistrationAdminListDto;
import com.sokoj.events.feature.registration.dto.RegistrationCreateRequestDto;
import com.sokoj.events.feature.registration.dto.RegistrationUpdateRequestDto;
import com.sokoj.events.feature.registration.service.RegistrationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/registrations")
@RequiredArgsConstructor
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping
    public RegistrationAdminDetailsDto create(@Valid @RequestBody RegistrationCreateRequestDto request) {
        return registrationService.create(request);
    }

    @GetMapping
    public List<RegistrationAdminListDto> findAll() {
        return registrationService.findAll();
    }

    @GetMapping("/{id}")
    public RegistrationAdminDetailsDto findById(@PathVariable Long id) {
        return registrationService.findById(id);
    }

    @PutMapping("/{id}")
    public RegistrationAdminDetailsDto update(
            @PathVariable Long id,
            @Valid @RequestBody RegistrationUpdateRequestDto request
    ) {
        return registrationService.update(id, request);
    }

    @PostMapping("/{id}/cancel")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancel(@PathVariable Long id) {
        registrationService.cancel(id);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        registrationService.delete(id);
    }
}
