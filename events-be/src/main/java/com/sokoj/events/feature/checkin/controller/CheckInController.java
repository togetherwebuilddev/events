package com.sokoj.events.feature.checkin.controller;

import com.sokoj.events.feature.checkin.dto.CheckInLogDto;
import com.sokoj.events.feature.checkin.dto.CheckInManualRequestDto;
import com.sokoj.events.feature.checkin.dto.CheckInResponseDto;
import com.sokoj.events.feature.checkin.dto.CheckInScanRequestDto;
import com.sokoj.events.feature.checkin.service.CheckInService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/checkin")
@RequiredArgsConstructor
public class CheckInController {

    private final CheckInService checkInService;

    @PostMapping("/scan")
    public CheckInResponseDto scan(@Valid @RequestBody CheckInScanRequestDto request) {
        return checkInService.scan(request);
    }

    @PostMapping("/manual")
    public CheckInResponseDto manual(@Valid @RequestBody CheckInManualRequestDto request) {
        return checkInService.manual(request);
    }

    @GetMapping("/logs")
    public List<CheckInLogDto> findAllLogs() {
        return checkInService.findAllLogs();
    }
}