package com.sokoj.events.feature.notification.email.service;

import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.notification.email.dto.EmailLogDto;
import com.sokoj.events.feature.notification.email.dto.EmailPreviewDto;
import com.sokoj.events.feature.notification.email.dto.EmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.SendInvitationRequestDto;
import com.sokoj.events.feature.notification.email.entity.EmailLog;
import com.sokoj.events.feature.notification.email.enums.EmailStatus;
import com.sokoj.events.feature.notification.email.enums.EmailType;
import com.sokoj.events.feature.notification.email.mapper.EmailMapper;
import com.sokoj.events.feature.notification.email.repository.EmailLogRepository;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import com.sokoj.events.feature.registration.enums.InvitationStatus;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final EventRegistrationRepository registrationRepository;
    private final EmailLogRepository emailLogRepository;
    private final EmailMapper emailMapper;

    @Transactional
    public EmailSendResultDto sendInvitation(SendInvitationRequestDto request) {
        EventRegistration registration = registrationRepository.findById(request.getRegistrationId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));

        String guestEmail = registration.getGuest().getEmail();
        if (guestEmail == null || guestEmail.isBlank()) {
            EmailLog failedLog = buildBaseEmailLog(registration, request);
            failedLog.setStatus(EmailStatus.FAILED);
            failedLog.setErrorMessage(MessageConstants.EMAIL_GUEST_EMAIL_MISSING);

            EmailLog savedFailedLog = emailLogRepository.save(failedLog);

            return emailMapper.toSendResultDto(
                    false,
                    MessageConstants.EMAIL_GUEST_EMAIL_MISSING,
                    savedFailedLog
            );
        }

        EmailLog emailLog = buildBaseEmailLog(registration, request);

        try {
            // Za sada simulacija uspešnog slanja
            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());

            EmailLog savedLog = emailLogRepository.save(emailLog);

            registration.setInvitationStatus(InvitationStatus.SENT);
            registration.setInvitationSentAt(LocalDateTime.now());
            registrationRepository.save(registration);

            return emailMapper.toSendResultDto(
                    true,
                    MessageConstants.EMAIL_SEND_SUCCESS,
                    savedLog
            );
        } catch (Exception ex) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(MessageConstants.EMAIL_SEND_FAILED);

            EmailLog savedLog = emailLogRepository.save(emailLog);

            return emailMapper.toSendResultDto(
                    false,
                    MessageConstants.EMAIL_SEND_FAILED,
                    savedLog
            );
        }
    }

    public EmailPreviewDto previewInvitation(Long registrationId) {
        EventRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));

        EmailPreviewDto dto = new EmailPreviewDto();
        dto.setRegistrationId(registration.getId());
        dto.setEmailTo(registration.getGuest().getEmail());
        dto.setSubject(buildSubject(registration));
        dto.setBody(buildBody(registration));

        return dto;
    }

    public List<EmailLogDto> findAllLogs() {
        return emailLogRepository.findAll()
                .stream()
                .map(emailMapper::toLogDto)
                .toList();
    }

    private EmailLog buildBaseEmailLog(EventRegistration registration, SendInvitationRequestDto request) {
        EmailLog emailLog = new EmailLog();
        emailLog.setEvent(registration.getEvent());
        emailLog.setRegistration(registration);
        emailLog.setGuest(registration.getGuest());
        emailLog.setEmailTo(registration.getGuest().getEmail());
        emailLog.setSubject(resolveSubject(request, registration));
        emailLog.setEmailType(request.getEmailType() != null ? request.getEmailType() : EmailType.INVITATION);
        return emailLog;
    }

    private String resolveSubject(SendInvitationRequestDto request, EventRegistration registration) {
        if (request.getSubject() != null && !request.getSubject().isBlank()) {
            return request.getSubject();
        }
        return buildSubject(registration);
    }

    private String buildSubject(EventRegistration registration) {
        return "Invitation for " + registration.getEvent().getName();
    }

    private String buildBody(EventRegistration registration) {
        return "Hello "
                + registration.getGuest().getFirstName()
                + " "
                + registration.getGuest().getLastName()
                + ",\n\n"
                + "You are invited to event: "
                + registration.getEvent().getName()
                + ".\n"
                + "Location: "
                + registration.getEvent().getLocation()
                + "\n"
                + "Start time: "
                + registration.getEvent().getStartTime()
                + "\n"
                + "Your QR token: "
                + registration.getQrToken();
    }
}