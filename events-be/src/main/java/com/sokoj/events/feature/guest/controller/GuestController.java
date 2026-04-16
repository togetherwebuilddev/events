package com.sokoj.events.feature.guest.controller;

import com.sokoj.events.feature.guest.dto.GuestAdminDetailsDto;
import com.sokoj.events.feature.guest.dto.GuestAdminListDto;
import com.sokoj.events.feature.guest.dto.GuestCreateRequestDto;
import com.sokoj.events.feature.guest.dto.GuestUpdateRequestDto;
import com.sokoj.events.feature.guest.service.GuestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/guests")
@RequiredArgsConstructor
public class GuestController {

    private final GuestService guestService;

    @PostMapping
    public GuestAdminDetailsDto create(@Valid @RequestBody GuestCreateRequestDto request) {
        return guestService.create(request);
    }

    @GetMapping
    public List<GuestAdminListDto> findAll() {
        return guestService.findAll();
    }

    @GetMapping("/{id}")
    public GuestAdminDetailsDto findById(@PathVariable Long id) {
        return guestService.findById(id);
    }

    @PutMapping("/{id}")
    public GuestAdminDetailsDto update(
            @PathVariable Long id,
            @Valid @RequestBody GuestUpdateRequestDto request
    ) {
        return guestService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        guestService.delete(id);
    }
}