package com.sokoj.events.feature.notification.email.service;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.EncodeHintType;
import com.google.zxing.MultiFormatWriter;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.notification.email.dto.BulkEmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.EmailLogDto;
import com.sokoj.events.feature.notification.email.dto.EmailPreviewDto;
import com.sokoj.events.feature.notification.email.dto.EmailSendResultDto;
import com.sokoj.events.feature.notification.email.dto.SendBulkInvitationsRequestDto;
import com.sokoj.events.feature.notification.email.dto.SendInvitationRequestDto;
import com.sokoj.events.feature.notification.email.entity.EmailLog;
import com.sokoj.events.feature.notification.email.enums.EmailStatus;
import com.sokoj.events.feature.notification.email.enums.EmailType;
import com.sokoj.events.feature.notification.email.mapper.EmailMapper;
import com.sokoj.events.feature.notification.email.repository.EmailLogRepository;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import com.sokoj.events.feature.registration.enums.InvitationStatus;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDFont;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.imageio.ImageIO;
import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@Service
@RequiredArgsConstructor
public class EmailService {

    private static final DateTimeFormatter EMAIL_DATE_FORMATTER =
            DateTimeFormatter.ofPattern("dd.MM.yyyy. HH:mm", new Locale("sr", "RS"));

    private static final int QR_IMAGE_SIZE = 420;
    private static final PDFont FONT_REGULAR = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    private static final PDFont FONT_BOLD = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
    private static final Color PDF_DARK_BLUE = new Color(15, 43, 91);
    private static final Color PDF_MID_BLUE = new Color(35, 74, 140);
    private static final Color PDF_LIGHT_BLUE = new Color(223, 233, 247);
    private static final Color PDF_WHITE = Color.WHITE;
    private static final Color PDF_GOLD = new Color(232, 196, 120);

    private final EventRegistrationRepository registrationRepository;
    private final EmailLogRepository emailLogRepository;
    private final EmailMapper emailMapper;
    private final JavaMailSender mailSender;

    @Value("${app.mail.from:}")
    private String mailFrom;

    @Transactional
    public EmailSendResultDto sendInvitation(SendInvitationRequestDto request) {
        EventRegistration registration = registrationRepository.findById(request.getRegistrationId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));

        String guestEmail = registration.getGuest().getEmail();
        if (guestEmail == null || guestEmail.isBlank()) {
            EmailLog failedLog = buildBaseEmailLog(registration, request);
            failedLog.setStatus(EmailStatus.FAILED);
            failedLog.setErrorMessage(MessageConstants.EMAIL_GUEST_EMAIL_MISSING);

            registration.setInvitationStatus(InvitationStatus.FAILED);
            registration.setInvitationSentAt(null);
            registrationRepository.save(registration);

            EmailLog savedFailedLog = emailLogRepository.save(failedLog);

            return emailMapper.toSendResultDto(
                    false,
                    false,
                    MessageConstants.EMAIL_GUEST_EMAIL_MISSING,
                    savedFailedLog
            );
        }

        var existingSuccessfulLog = emailLogRepository
                .findFirstByEvent_IdAndEmailToIgnoreCaseAndStatusOrderBySentAtDesc(
                        registration.getEvent().getId(),
                        guestEmail,
                        EmailStatus.SENT
                );

        if (existingSuccessfulLog.isPresent()) {
            EmailLog sentLog = existingSuccessfulLog.get();
            registration.setInvitationStatus(InvitationStatus.SENT);
            registration.setInvitationSentAt(
                    sentLog.getSentAt() != null ? sentLog.getSentAt() : sentLog.getCreatedAt()
            );
            registrationRepository.save(registration);

            return emailMapper.toSendResultDto(
                    true,
                    true,
                    MessageConstants.EMAIL_ALREADY_SENT,
                    sentLog
            );
        }

        EmailLog emailLog = buildBaseEmailLog(registration, request);
        String emailBody = buildBody(registration, request.getBody());

        try {
            if (emailBody.isBlank()) {
                throw new IllegalStateException(MessageConstants.EMAIL_SEND_FAILED);
            }

            byte[] qrImageBytes = generateQrImage(registration.getQrToken());
            byte[] ticketPdfBytes = generateTicketPdf(registration, qrImageBytes);
            sendMimeEmail(registration, guestEmail, emailLog.getSubject(), emailBody, qrImageBytes, ticketPdfBytes);

            emailLog.setStatus(EmailStatus.SENT);
            emailLog.setSentAt(LocalDateTime.now());

            EmailLog savedLog = emailLogRepository.save(emailLog);

            registration.setInvitationStatus(InvitationStatus.SENT);
            registration.setInvitationSentAt(LocalDateTime.now());
            registrationRepository.save(registration);

            return emailMapper.toSendResultDto(
                    true,
                    false,
                    MessageConstants.EMAIL_SEND_SUCCESS,
                    savedLog
            );
        } catch (Exception ex) {
            emailLog.setStatus(EmailStatus.FAILED);
            emailLog.setErrorMessage(resolveErrorMessage(ex));

            registration.setInvitationStatus(InvitationStatus.FAILED);
            registration.setInvitationSentAt(null);
            registrationRepository.save(registration);

            EmailLog savedLog = emailLogRepository.save(emailLog);

            return emailMapper.toSendResultDto(
                    false,
                    false,
                    MessageConstants.EMAIL_SEND_FAILED,
                    savedLog
            );
        }
    }

    public BulkEmailSendResultDto sendInvitations(SendBulkInvitationsRequestDto request) {
        List<EmailSendResultDto> results = request.getRegistrationIds()
                .stream()
                .distinct()
                .map(registrationId -> {
                    SendInvitationRequestDto singleRequest = new SendInvitationRequestDto();
                    singleRequest.setRegistrationId(registrationId);
                    singleRequest.setSubject(request.getSubject());
                    singleRequest.setBody(request.getBody());
                    singleRequest.setEmailType(request.getEmailType());
                    return sendInvitation(singleRequest);
                })
                .toList();

        int successCount = (int) results.stream()
                .filter(result -> result.isSuccess() && !result.isSkipped())
                .count();
        int skippedCount = (int) results.stream()
                .filter(EmailSendResultDto::isSkipped)
                .count();
        int failedCount = results.size() - successCount;
        failedCount -= skippedCount;

        BulkEmailSendResultDto response = new BulkEmailSendResultDto();
        response.setResults(results);
        response.setTotalRequested(results.size());
        response.setSuccessCount(successCount);
        response.setSkippedCount(skippedCount);
        response.setFailedCount(failedCount);
        response.setSuccess(failedCount == 0);
        response.setMessage(failedCount == 0 && skippedCount == 0
                ? MessageConstants.EMAIL_BULK_SEND_SUCCESS
                : MessageConstants.EMAIL_BULK_SEND_PARTIAL);

        return response;
    }

    public EmailPreviewDto previewInvitation(Long registrationId) {
        EventRegistration registration = registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));

        EmailPreviewDto dto = new EmailPreviewDto();
        dto.setRegistrationId(registration.getId());
        dto.setEmailTo(registration.getGuest().getEmail());
        dto.setSubject(buildSubject(registration));
        dto.setBody(buildBody(registration, null));

        return dto;
    }

    public List<EmailLogDto> findAllLogs() {
        return emailLogRepository.findAll()
                .stream()
                .map(emailMapper::toLogDto)
                .toList();
    }

    public ResponseEntity<ByteArrayResource> downloadQrPng(Long registrationId) {
        EventRegistration registration = ensureQrToken(findRegistration(registrationId));

        try {
            byte[] qrImageBytes = generateQrImage(registration.getQrToken());
            String fileName = buildDownloadFileName(registration, "png");
            return buildDownloadResponse(qrImageBytes, fileName, MediaType.IMAGE_PNG_VALUE);
        } catch (IOException | WriterException ex) {
            throw new IllegalStateException(MessageConstants.EMAIL_SEND_FAILED, ex);
        }
    }

    public ResponseEntity<ByteArrayResource> downloadTicketPdf(Long registrationId) {
        EventRegistration registration = ensureQrToken(findRegistration(registrationId));

        try {
            byte[] qrImageBytes = generateQrImage(registration.getQrToken());
            byte[] ticketPdfBytes = generateTicketPdf(registration, qrImageBytes);
            String fileName = buildDownloadFileName(registration, "pdf");
            return buildDownloadResponse(ticketPdfBytes, fileName, MediaType.APPLICATION_PDF_VALUE);
        } catch (IOException | WriterException ex) {
            throw new IllegalStateException(MessageConstants.EMAIL_SEND_FAILED, ex);
        }
    }

    public ResponseEntity<ByteArrayResource> downloadQrArchive(List<Long> registrationIds) {
        return buildArchiveResponse(registrationIds, "png", MediaType.IMAGE_PNG_VALUE);
    }

    public ResponseEntity<ByteArrayResource> downloadPdfArchive(List<Long> registrationIds) {
        return buildArchiveResponse(registrationIds, "pdf", MediaType.APPLICATION_PDF_VALUE);
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
        return "Pozivnica za dogadjaj " + registration.getEvent().getName();
    }

    private ResponseEntity<ByteArrayResource> buildArchiveResponse(
            List<Long> registrationIds,
            String extension,
            String contentType
    ) {
        try {
            ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
            try (ZipOutputStream zipOutputStream = new ZipOutputStream(outputStream)) {
                for (Long registrationId : registrationIds.stream().distinct().toList()) {
                    EventRegistration registration = ensureQrToken(findRegistration(registrationId));
                    byte[] fileBytes = "png".equals(extension)
                            ? generateQrImage(registration.getQrToken())
                            : generateTicketPdf(registration, generateQrImage(registration.getQrToken()));
                    String entryName = buildDownloadFileName(registration, extension);
                    zipOutputStream.putNextEntry(new ZipEntry(entryName));
                    zipOutputStream.write(fileBytes);
                    zipOutputStream.closeEntry();
                }
            }

            return buildDownloadResponse(
                    outputStream.toByteArray(),
                    "ulaznice-" + extension + ".zip",
                    "application/zip"
            );
        } catch (IOException | WriterException ex) {
            throw new IllegalStateException(MessageConstants.EMAIL_SEND_FAILED, ex);
        }
    }

    private String buildBody(EventRegistration registration, String customBody) {
        String baseBody;

        if (customBody != null && !customBody.isBlank()) {
            baseBody = applyTemplate(customBody, registration);
        } else {
            baseBody = applyTemplate(String.join("\n",
                    "Postovani/a {{guestFullName}},",
                    "",
                    "Pozivamo Vas na dogadjaj \"{{eventName}}\".",
                    "",
                    "Lokacija: {{eventLocation}}",
                    "Pocetak: {{eventStart}}",
                    "Kraj: {{eventEnd}}",
                    "",
                    "Vas jedinstveni QR kod za ulaz:",
                    "{{qrToken}}",
                    "",
                    "QR kod saljemo i kao PNG sliku i kao PDF ulaznicu, kako biste ga lako sacuvali ili prosledili.",
                    "PNG fajl mozete jednostavno poslati i preko Vibera.",
                    "",
                    "Srdacan pozdrav,",
                    "Organizacija dogadjaja"
            ), registration);
        }

        return baseBody;
    }

    private String applyTemplate(String template, EventRegistration registration) {
        return template
                .replace("{{guestFirstName}}", safe(registration.getGuest().getFirstName()))
                .replace("{{guestLastName}}", safe(registration.getGuest().getLastName()))
                .replace("{{guestFullName}}",
                        (safe(registration.getGuest().getFirstName()) + " "
                                + safe(registration.getGuest().getLastName())).trim())
                .replace("{{eventName}}", safe(registration.getEvent().getName()))
                .replace("{{eventLocation}}", safe(registration.getEvent().getLocation()))
                .replace("{{eventStart}}", formatDateTime(registration.getEvent().getStartTime()))
                .replace("{{eventEnd}}", formatDateTime(registration.getEvent().getEndTime()))
                .replace("{{qrToken}}", safe(registration.getQrToken()));
    }

    private void sendMimeEmail(
            EventRegistration registration,
            String guestEmail,
            String subject,
            String emailBody,
            byte[] qrImageBytes,
            byte[] ticketPdfBytes
    ) throws Exception {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");

        if (mailFrom != null && !mailFrom.isBlank()) {
            helper.setFrom(mailFrom);
        }

        helper.setTo(guestEmail);
        helper.setSubject(subject);
        String qrContentId = "event-qr-" + registration.getId();
        helper.setText(emailBody, buildHtmlBody(registration, emailBody, qrContentId));

        String fileBaseName = buildFileBaseName(registration);
        helper.addInline(
                qrContentId,
                new ByteArrayResource(qrImageBytes),
                "image/png"
        );
        helper.addAttachment(
                fileBaseName + "-qr.png",
                new ByteArrayResource(qrImageBytes),
                "image/png"
        );
        helper.addAttachment(
                fileBaseName + "-ulaznica.pdf",
                new ByteArrayResource(ticketPdfBytes),
                "application/pdf"
        );

        mailSender.send(mimeMessage);
    }

    private byte[] generateQrImage(String qrToken) throws WriterException, IOException {
        Map<EncodeHintType, Object> hints = new EnumMap<>(EncodeHintType.class);
        hints.put(EncodeHintType.MARGIN, 1);

        BitMatrix bitMatrix = new MultiFormatWriter().encode(
                qrToken,
                BarcodeFormat.QR_CODE,
                QR_IMAGE_SIZE,
                QR_IMAGE_SIZE,
                hints
        );

        BufferedImage image = MatrixToImageWriter.toBufferedImage(bitMatrix);
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        ImageIO.write(image, "PNG", outputStream);
        return outputStream.toByteArray();
    }

    private byte[] generateTicketPdf(EventRegistration registration, byte[] qrImageBytes) throws IOException {
        try (PDDocument document = new PDDocument();
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            PDPage page = new PDPage(PDRectangle.A4);
            document.addPage(page);

            PDImageXObject qrImage = PDImageXObject.createFromByteArray(document, qrImageBytes, "qr-code");

            try (PDPageContentStream contentStream = new PDPageContentStream(document, page)) {
                float pageWidth = page.getMediaBox().getWidth();
                float pageHeight = page.getMediaBox().getHeight();
                float margin = 40;
                float cardX = margin;
                float cardY = 72;
                float cardWidth = pageWidth - (margin * 2);
                float cardHeight = pageHeight - 144;

                fillRect(contentStream, cardX, cardY, cardWidth, cardHeight, PDF_DARK_BLUE);
                fillRect(contentStream, cardX, cardY + cardHeight - 92, cardWidth, 92, PDF_MID_BLUE);

                writeLine(contentStream, FONT_REGULAR, 11, cardX + 26, cardY + cardHeight - 28, "SOKOJ EVENTS", PDF_GOLD);
                writeLine(contentStream, FONT_BOLD, 28, cardX + 26, cardY + cardHeight - 58, "POZIVNICA", PDF_WHITE);

                float leftColumnX = cardX + 28;
                float leftColumnWidth = 272;
                float detailTopY = cardY + cardHeight - 126;

                writeLine(contentStream, FONT_BOLD, 18, leftColumnX, detailTopY, pdfText(safe(registration.getEvent().getName())), PDF_WHITE);
                writeLine(contentStream, FONT_REGULAR, 12, leftColumnX, detailTopY - 26, pdfText(safe(registration.getEvent().getLocation())), PDF_LIGHT_BLUE);

                float infoBoxHeight = 240;
                float infoBoxY = detailTopY - 286;
                fillRect(contentStream, leftColumnX, infoBoxY, leftColumnWidth, infoBoxHeight, new Color(26, 58, 112));
                drawBorder(contentStream, leftColumnX, infoBoxY, leftColumnWidth, infoBoxHeight, PDF_GOLD);

                float infoTextX = leftColumnX + 16;
                float infoTextWidth = leftColumnWidth - 32;
                float currentY = infoBoxY + infoBoxHeight - 26;

                currentY = writeDetailField(
                        contentStream,
                        infoTextX,
                        currentY,
                        infoTextWidth,
                        "GOST",
                        guestDisplayName(registration)
                );
                currentY = writeDetailField(
                        contentStream,
                        infoTextX,
                        currentY,
                        infoTextWidth,
                        "EMAIL",
                        safe(registration.getGuest().getEmail())
                );
                currentY = writeDetailField(
                        contentStream,
                        infoTextX,
                        currentY,
                        infoTextWidth,
                        "POCETAK",
                        formatDateTime(registration.getEvent().getStartTime())
                );
                writeDetailField(
                        contentStream,
                        infoTextX,
                        currentY,
                        infoTextWidth,
                        "KRAJ",
                        formatDateTime(registration.getEvent().getEndTime())
                );

                float qrPanelWidth = 220;
                float qrPanelX = cardX + cardWidth - qrPanelWidth - 28;
                float qrPanelY = cardY + 170;
                fillRect(contentStream, qrPanelX, qrPanelY, qrPanelWidth, 300, PDF_WHITE);
                drawBorder(contentStream, qrPanelX, qrPanelY, qrPanelWidth, 300, new Color(210, 220, 236));
                writeLine(contentStream, FONT_REGULAR, 10, qrPanelX + 74, qrPanelY + 278, "QR ZA ULAZ", PDF_MID_BLUE);

                float qrSize = 162;
                float qrX = qrPanelX + (qrPanelWidth - qrSize) / 2;
                float qrY = qrPanelY + 92;
                contentStream.drawImage(qrImage, qrX, qrY, qrSize, qrSize);

                writeLine(contentStream, FONT_REGULAR, 10, qrPanelX + 42, qrPanelY + 68,
                        "Pokazite ovaj kod na ulazu.", new Color(74, 91, 114));

                float tokenBoxX = cardX + 28;
                float tokenBoxY = cardY + 40;
                float tokenBoxWidth = cardWidth - 56;
                float tokenBoxHeight = 96;
                fillRect(contentStream, tokenBoxX, tokenBoxY, tokenBoxWidth, tokenBoxHeight, new Color(11, 30, 63));
                drawBorder(contentStream, tokenBoxX, tokenBoxY, tokenBoxWidth, tokenBoxHeight, new Color(71, 102, 158));
                writeLine(contentStream, FONT_REGULAR, 10, tokenBoxX + 16, tokenBoxY + 72, "JEDINSTVENI TOKEN", PDF_GOLD);
                writeWrappedText(
                        contentStream,
                        FONT_BOLD,
                        10,
                        tokenBoxX + 16,
                        tokenBoxY + 50,
                        tokenBoxWidth - 32,
                        14,
                        safe(registration.getQrToken()),
                        PDF_WHITE
                );

                writeLine(contentStream, FONT_REGULAR, 10, tokenBoxX + 16, tokenBoxY - 18,
                        "PDF mozete sacuvati, a PNG QR kod lako proslediti i preko Vibera.", PDF_LIGHT_BLUE);
            }

            document.save(outputStream);
            return outputStream.toByteArray();
        }
    }

    private void writeLine(
            PDPageContentStream contentStream,
            org.apache.pdfbox.pdmodel.font.PDFont font,
            float fontSize,
            float x,
            float y,
            String text,
            Color color
    ) throws IOException {
        contentStream.setNonStrokingColor(color);
        contentStream.beginText();
        contentStream.setFont(font, fontSize);
        contentStream.newLineAtOffset(x, y);
        contentStream.showText(text);
        contentStream.endText();
    }

    private void writeWrappedText(
            PDPageContentStream contentStream,
            PDFont font,
            float fontSize,
            float x,
            float startY,
            float maxWidth,
            float lineHeight,
            String text,
            Color color
    ) throws IOException {
        String remaining = safe(text);
        float currentY = startY;

        while (!remaining.isBlank()) {
            int breakIndex = findFittingBreakIndex(font, fontSize, remaining, maxWidth);
            String line = remaining.substring(0, breakIndex).trim();
            writeLine(contentStream, font, fontSize, x, currentY, line, color);
            remaining = remaining.substring(breakIndex).trim();
            currentY -= lineHeight;
        }
    }

    private float writeWrappedTextBlock(
            PDPageContentStream contentStream,
            PDFont font,
            float fontSize,
            float x,
            float startY,
            float maxWidth,
            float lineHeight,
            String text,
            Color color
    ) throws IOException {
        String remaining = safe(text);
        float currentY = startY;

        while (!remaining.isBlank()) {
            int breakIndex = findFittingBreakIndex(font, fontSize, remaining, maxWidth);
            String line = remaining.substring(0, breakIndex).trim();
            writeLine(contentStream, font, fontSize, x, currentY, pdfText(line), color);
            remaining = remaining.substring(breakIndex).trim();
            currentY -= lineHeight;
        }

        return currentY;
    }

    private float writeDetailField(
            PDPageContentStream contentStream,
            float x,
            float startY,
            float maxWidth,
            String label,
            String value
    ) throws IOException {
        writeLine(contentStream, FONT_REGULAR, 10, x, startY, label, PDF_GOLD);
        float nextY = writeWrappedTextBlock(
                contentStream,
                FONT_BOLD,
                12,
                x,
                startY - 18,
                maxWidth,
                14,
                value,
                PDF_WHITE
        );
        return nextY - 14;
    }

    private int findFittingBreakIndex(PDFont font, float fontSize, String text, float maxWidth) throws IOException {
        if (textWidth(font, fontSize, text) <= maxWidth) {
            return text.length();
        }

        int breakIndex = text.length();
        while (breakIndex > 1) {
            breakIndex--;
            String candidate = text.substring(0, breakIndex);
            if (textWidth(font, fontSize, candidate) <= maxWidth) {
                return breakIndex;
            }
        }

        return 1;
    }

    private float textWidth(PDFont font, float fontSize, String text) throws IOException {
        return font.getStringWidth(pdfText(text)) / 1000f * fontSize;
    }

    private void fillRect(
            PDPageContentStream contentStream,
            float x,
            float y,
            float width,
            float height,
            Color color
    ) throws IOException {
        contentStream.setNonStrokingColor(color);
        contentStream.addRect(x, y, width, height);
        contentStream.fill();
    }

    private void drawBorder(
            PDPageContentStream contentStream,
            float x,
            float y,
            float width,
            float height,
            Color color
    ) throws IOException {
        contentStream.setStrokingColor(color);
        contentStream.addRect(x, y, width, height);
        contentStream.stroke();
    }

    private String buildFileBaseName(EventRegistration registration) {
        return sanitizeFileName(registration.getEvent().getName()) + "-" + sanitizeFileName(guestFullName(registration));
    }

    private String buildDownloadFileName(EventRegistration registration, String extension) {
        String firstName = sanitizeFileName(safe(registration.getGuest().getFirstName()));
        String lastName = sanitizeFileName(safe(registration.getGuest().getLastName()));
        String shortenedToken = shortenToken(safe(registration.getQrToken()));
        return firstName + "_" + lastName + "_" + shortenedToken + "_" + registration.getId() + "." + extension;
    }

    private String guestFullName(EventRegistration registration) {
        return (safe(registration.getGuest().getFirstName()) + "-" + safe(registration.getGuest().getLastName()))
                .replace(' ', '-');
    }

    private String guestDisplayName(EventRegistration registration) {
        return (safe(registration.getGuest().getFirstName()) + " " + safe(registration.getGuest().getLastName())).trim();
    }

    private String sanitizeFileName(String value) {
        String normalized = Normalizer.normalize(safe(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        String sanitized = normalized.replaceAll("[^A-Za-z0-9_-]+", "-")
                .replaceAll("-{2,}", "-")
                .replaceAll("^-|-$", "");
        return sanitized.isBlank() ? "pozivnica" : sanitized.toLowerCase(Locale.ROOT);
    }

    private String shortenToken(String token) {
        String sanitizedToken = sanitizeFileName(token);
        if (sanitizedToken.length() <= 12) {
            return sanitizedToken;
        }

        return sanitizedToken.substring(sanitizedToken.length() - 12);
    }

    private String formatDateTime(LocalDateTime value) {
        return value == null ? "" : value.format(EMAIL_DATE_FORMATTER);
    }

    private EventRegistration findRegistration(Long registrationId) {
        return registrationRepository.findById(registrationId)
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));
    }

    private EventRegistration ensureQrToken(EventRegistration registration) {
        if (registration.getQrToken() != null && !registration.getQrToken().isBlank()) {
            return registration;
        }

        String token;
        do {
            token = "EVT-" + registration.getEvent().getId() + "-" + UUID.randomUUID();
        } while (registrationRepository.existsByQrToken(token));

        registration.setQrToken(token);
        return registrationRepository.save(registration);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private ResponseEntity<ByteArrayResource> buildDownloadResponse(
            byte[] bytes,
            String fileName,
            String contentType
    ) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .contentLength(bytes.length)
                .body(new ByteArrayResource(bytes));
    }

    private String pdfText(String value) {
        String normalized = Normalizer.normalize(safe(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized
                .replace('–', '-')
                .replace('—', '-')
                .replace('“', '"')
                .replace('”', '"')
                .replace('’', '\'');
    }

    private String resolveErrorMessage(Exception ex) {
        String message = ex.getMessage();
        if (message == null || message.isBlank()) {
            return MessageConstants.EMAIL_SEND_FAILED;
        }
        return message.length() > 1000 ? message.substring(0, 1000) : message;
    }

    private String buildHtmlBody(EventRegistration registration, String plainBody, String qrContentId) {
        String eventName = escapeHtml(safe(registration.getEvent().getName()));
        String location = escapeHtml(safe(registration.getEvent().getLocation()));
        String guestName = escapeHtml((safe(registration.getGuest().getFirstName()) + " "
                + safe(registration.getGuest().getLastName())).trim());
        String eventStart = escapeHtml(formatDateTime(registration.getEvent().getStartTime()));
        String eventEnd = escapeHtml(formatDateTime(registration.getEvent().getEndTime()));
        String qrToken = escapeHtml(safe(registration.getQrToken()));
        String bodyHtml = convertPlainTextToHtml(plainBody);

        return """
                <html>
                  <body style="margin:0;padding:0;background:#f5f7fb;font-family:Arial,Helvetica,sans-serif;color:#193243;">
                    <div style="max-width:680px;margin:0 auto;padding:24px 16px;">
                      <div style="background:#ffffff;border:1px solid #dde5ec;border-radius:20px;overflow:hidden;">
                        <div style="background:linear-gradient(135deg,#15597a 0%%,#287596 100%%);padding:28px 32px;color:#ffffff;">
                          <div style="font-size:12px;letter-spacing:1.6px;text-transform:uppercase;opacity:0.85;">Pozivnica</div>
                          <div style="font-size:30px;font-weight:700;line-height:1.2;margin-top:8px;">%s</div>
                          <div style="font-size:15px;line-height:1.5;opacity:0.92;margin-top:10px;">Dobrodosli, %s</div>
                        </div>
                        <div style="padding:28px 32px 20px 32px;">
                          <div style="font-size:15px;line-height:1.7;">%s</div>
                          <table role="presentation" style="width:100%%;border-collapse:separate;border-spacing:0;margin-top:24px;">
                            <tr>
                              <td style="width:50%%;vertical-align:top;padding-right:12px;">
                                <div style="background:#f6f9fc;border:1px solid #dbe4ec;border-radius:16px;padding:18px;">
                                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#6a7c89;">Detalji dogadjaja</div>
                                  <div style="font-size:22px;font-weight:700;color:#17384e;margin-top:10px;">%s</div>
                                  <div style="margin-top:14px;font-size:14px;line-height:1.8;color:#324d61;">
                                    <div><strong>Lokacija:</strong> %s</div>
                                    <div><strong>Pocetak:</strong> %s</div>
                                    <div><strong>Kraj:</strong> %s</div>
                                  </div>
                                </div>
                              </td>
                              <td style="width:50%%;vertical-align:top;padding-left:12px;">
                                <div style="background:#fffdf9;border:1px solid #eadfcf;border-radius:16px;padding:18px;text-align:center;">
                                  <div style="font-size:12px;text-transform:uppercase;letter-spacing:1px;color:#8a6f47;">QR za ulaz</div>
                                  <img src="cid:%s" alt="QR kod za ulaz" style="width:220px;max-width:100%%;height:auto;display:block;margin:14px auto 10px auto;" />
                                  <div style="font-size:12px;line-height:1.6;color:#6a5a43;word-break:break-word;">%s</div>
                                </div>
                              </td>
                            </tr>
                          </table>
                          <div style="margin-top:20px;background:#f8efe4;border:1px solid #edd9bf;border-radius:14px;padding:14px 16px;font-size:13px;line-height:1.7;color:#5a4a33;">
                            U prilogu se nalaze PNG QR kod i PDF ulaznica. PNG mozete lako proslediti i preko Vibera.
                          </div>
                        </div>
                      </div>
                    </div>
                  </body>
                </html>
                """.formatted(
                eventName,
                guestName,
                bodyHtml,
                eventName,
                location,
                eventStart,
                eventEnd,
                qrContentId,
                qrToken
        );
    }

    private String convertPlainTextToHtml(String value) {
        return escapeHtml(value).replace("\n", "<br/>");
    }

    private String escapeHtml(String value) {
        return safe(value)
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
