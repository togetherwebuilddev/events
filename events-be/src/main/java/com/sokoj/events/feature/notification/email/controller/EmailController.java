package com.sokoj.events.feature.notification.email.controller;

import com.sokoj.events.feature.notification.email.dto.EmailLogDto;
import com.sokoj.events.feature.notification.email.dto.EmailPreviewDto;
import com.sokoj.events.feature.notification.email.dto.EmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.SendInvitationRequestDto;
import com.sokoj.events.feature.notification.email.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/emails")
@RequiredArgsConstructor
public class EmailController {

    private final EmailService emailService;

    @PostMapping("/send-invitation")
    public EmailSendResultDto sendInvitation(@Valid @RequestBody SendInvitationRequestDto request) {
        return emailService.sendInvitation(request);
    }

    @GetMapping("/preview/{registrationId}")
    public EmailPreviewDto previewInvitation(@PathVariable Long registrationId) {
        return emailService.previewInvitation(registrationId);
    }

    @GetMapping("/logs")
    public List<EmailLogDto> findAllLogs() {
        return emailService.findAllLogs();
    }
}