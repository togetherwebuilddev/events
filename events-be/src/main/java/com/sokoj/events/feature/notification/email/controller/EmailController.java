package com.sokoj.events.feature.notification.email.controller;

import com.sokoj.events.feature.notification.email.dto.EmailLogDto;
import com.sokoj.events.feature.notification.email.dto.EmailPreviewDto;
import com.sokoj.events.feature.notification.email.dto.EmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.BulkEmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.BulkTicketDownloadRequestDto;
import com.sokoj.events.feature.notification.email.dto.SendBulkInvitationsRequestDto;
import com.sokoj.events.feature.notification.email.dto.SendInvitationRequestDto;
import com.sokoj.events.feature.notification.email.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ResponseEntity;
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

    @PostMapping("/send-invitations")
    public BulkEmailSendResultDto sendInvitations(@Valid @RequestBody SendBulkInvitationsRequestDto request) {
        return emailService.sendInvitations(request);
    }

    @GetMapping("/preview/{registrationId}")
    public EmailPreviewDto previewInvitation(@PathVariable Long registrationId) {
        return emailService.previewInvitation(registrationId);
    }

    @GetMapping("/logs")
    public List<EmailLogDto> findAllLogs() {
        return emailService.findAllLogs();
    }

    @GetMapping("/registrations/{registrationId}/qr.png")
    public ResponseEntity<ByteArrayResource> downloadQrPng(@PathVariable Long registrationId) {
        return emailService.downloadQrPng(registrationId);
    }

    @GetMapping("/registrations/{registrationId}/ticket.pdf")
    public ResponseEntity<ByteArrayResource> downloadTicketPdf(@PathVariable Long registrationId) {
        return emailService.downloadTicketPdf(registrationId);
    }

    @PostMapping("/downloads/qr.zip")
    public ResponseEntity<ByteArrayResource> downloadQrArchive(
            @Valid @RequestBody BulkTicketDownloadRequestDto request
    ) {
        return emailService.downloadQrArchive(request.getRegistrationIds());
    }

    @PostMapping("/downloads/pdf.zip")
    public ResponseEntity<ByteArrayResource> downloadPdfArchive(
            @Valid @RequestBody BulkTicketDownloadRequestDto request
    ) {
        return emailService.downloadPdfArchive(request.getRegistrationIds());
    }
}
