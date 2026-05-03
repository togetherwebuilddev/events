package com.sokoj.events.feature.notification.email.mapper;

import com.sokoj.events.feature.notification.email.dto.EmailLogDto;
import com.sokoj.events.feature.notification.email.dto.EmailSendResultDto;
import com.sokoj.events.feature.notification.email.entity.EmailLog;
import org.springframework.stereotype.Component;

@Component
public class EmailMapper {

    public EmailLogDto toLogDto(EmailLog emailLog) {
        EmailLogDto dto = new EmailLogDto();

        dto.setId(emailLog.getId());
        dto.setEventId(emailLog.getEvent() != null ? emailLog.getEvent().getId() : null);
        dto.setRegistrationId(emailLog.getRegistration() != null ? emailLog.getRegistration().getId() : null);
        dto.setGuestId(emailLog.getGuest() != null ? emailLog.getGuest().getId() : null);

        dto.setEmailTo(emailLog.getEmailTo());
        dto.setSubject(emailLog.getSubject());
        dto.setEmailType(emailLog.getEmailType());
        dto.setStatus(emailLog.getStatus());

        dto.setErrorMessage(emailLog.getErrorMessage());
        dto.setSentAt(emailLog.getSentAt());
        dto.setCreatedAt(emailLog.getCreatedAt());

        return dto;
    }

    public EmailSendResultDto toSendResultDto(
            boolean success,
            boolean skipped,
            String message,
            EmailLog emailLog
    ) {
        EmailSendResultDto dto = new EmailSendResultDto();

        dto.setSuccess(success);
        dto.setSkipped(skipped);
        dto.setMessage(message);

        dto.setEmailLogId(emailLog.getId());
        dto.setEventId(emailLog.getEvent() != null ? emailLog.getEvent().getId() : null);
        dto.setRegistrationId(emailLog.getRegistration() != null ? emailLog.getRegistration().getId() : null);
        dto.setGuestId(emailLog.getGuest() != null ? emailLog.getGuest().getId() : null);

        dto.setEmailTo(emailLog.getEmailTo());
        dto.setSubject(emailLog.getSubject());
        dto.setEmailType(emailLog.getEmailType());
        dto.setStatus(emailLog.getStatus());

        dto.setSentAt(emailLog.getSentAt());

        return dto;
    }
}
