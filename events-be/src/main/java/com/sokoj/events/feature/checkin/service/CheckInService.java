package com.sokoj.events.feature.checkin.service;

import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.checkin.dto.CheckInLogDto;
import com.sokoj.events.feature.checkin.dto.CheckInManualRequestDto;
import com.sokoj.events.feature.checkin.dto.CheckInResponseDto;
import com.sokoj.events.feature.checkin.dto.CheckInScanRequestDto;
import com.sokoj.events.feature.checkin.entity.CheckInLog;
import com.sokoj.events.feature.checkin.enums.CheckInMethod;
import com.sokoj.events.feature.checkin.enums.ScanResult;
import com.sokoj.events.feature.checkin.mapper.CheckInMapper;
import com.sokoj.events.feature.checkin.repository.CheckInLogRepository;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import com.sokoj.events.feature.registration.enums.AttendanceStatus;
import com.sokoj.events.feature.registration.repository.EventRegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CheckInService {

    private final EventRegistrationRepository registrationRepository;
    private final CheckInLogRepository checkInLogRepository;
    private final CheckInMapper checkInMapper;

    @Transactional
    public CheckInResponseDto scan(CheckInScanRequestDto request) {
        EventRegistration registration = registrationRepository.findByQrTokenForUpdate(request.getToken())
                .orElse(null);

        if (registration == null) {
            saveInvalidTokenLog(request);
            CheckInResponseDto response = new CheckInResponseDto();
            response.setSuccess(false);
            response.setResult(ScanResult.INVALID_TOKEN);
            response.setMessage(MessageConstants.CHECKIN_INVALID_TOKEN);
            return response;
        }

        if (registration.getCanceledAt() != null) {
            return checkInMapper.toResponseDto(
                    false,
                    ScanResult.CANCELED_REGISTRATION,
                    "Prijava za ovaj dogadjaj je otkazana.",
                    registration
            );
        }

        if (registration.getAttendanceStatus() == AttendanceStatus.CHECKED_IN
                || registration.getAttendanceStatus() == AttendanceStatus.MANUAL_CHECKED_IN) {

            saveLog(
                    registration,
                    request.getToken(),
                    ScanResult.ALREADY_CHECKED_IN,
                    CheckInMethod.QR_SCAN,
                    request.getScannedBy(),
                    request.getDeviceInfo(),
                    MessageConstants.CHECKIN_ALREADY_COMPLETED
            );

            return checkInMapper.toResponseDto(
                    false,
                    ScanResult.ALREADY_CHECKED_IN,
                    MessageConstants.CHECKIN_ALREADY_COMPLETED,
                    registration
            );
        }

        registration.setAttendanceStatus(AttendanceStatus.CHECKED_IN);
        registration.setCheckedInAt(LocalDateTime.now());
        registration.setCheckedInBy(request.getScannedBy());

        EventRegistration saved = registrationRepository.save(registration);

        saveLog(
                saved,
                request.getToken(),
                ScanResult.SUCCESS,
                CheckInMethod.QR_SCAN,
                request.getScannedBy(),
                request.getDeviceInfo(),
                MessageConstants.CHECKIN_SUCCESS
        );

        return checkInMapper.toResponseDto(
                true,
                ScanResult.SUCCESS,
                MessageConstants.CHECKIN_SUCCESS,
                saved
        );
    }

    @Transactional
    public CheckInResponseDto manual(CheckInManualRequestDto request) {
        EventRegistration registration = registrationRepository.findByIdForUpdate(request.getRegistrationId())
                .orElseThrow(() -> new NotFoundException(MessageConstants.REGISTRATION_NOT_FOUND));

        if (registration.getCanceledAt() != null) {
            return checkInMapper.toResponseDto(
                    false,
                    ScanResult.CANCELED_REGISTRATION,
                    "Prijava za ovaj dogadjaj je otkazana.",
                    registration
            );
        }

        if (registration.getAttendanceStatus() == AttendanceStatus.CHECKED_IN
                || registration.getAttendanceStatus() == AttendanceStatus.MANUAL_CHECKED_IN) {

            saveLog(
                    registration,
                    registration.getQrToken(),
                    ScanResult.ALREADY_CHECKED_IN,
                    CheckInMethod.MANUAL,
                    request.getScannedBy(),
                    request.getDeviceInfo(),
                    MessageConstants.CHECKIN_ALREADY_COMPLETED
            );

            return checkInMapper.toResponseDto(
                    false,
                    ScanResult.ALREADY_CHECKED_IN,
                    MessageConstants.CHECKIN_ALREADY_COMPLETED,
                    registration
            );
        }

        registration.setAttendanceStatus(AttendanceStatus.MANUAL_CHECKED_IN);
        registration.setCheckedInAt(LocalDateTime.now());
        registration.setCheckedInBy(request.getScannedBy());
        registration.setManualCheckInReason(request.getManualReason());

        EventRegistration saved = registrationRepository.save(registration);

        saveLog(
                saved,
                saved.getQrToken(),
                ScanResult.SUCCESS,
                CheckInMethod.MANUAL,
                request.getScannedBy(),
                request.getDeviceInfo(),
                MessageConstants.CHECKIN_MANUAL_SUCCESS
        );

        return checkInMapper.toResponseDto(
                true,
                ScanResult.SUCCESS,
                MessageConstants.CHECKIN_MANUAL_SUCCESS,
                saved
        );
    }

    public List<CheckInLogDto> findAllLogs() {
        return checkInLogRepository.findAll()
                .stream()
                .map(checkInMapper::toLogDto)
                .toList();
    }

    private void saveInvalidTokenLog(CheckInScanRequestDto request) {
        CheckInLog log = new CheckInLog();
        log.setEvent(null); // ne možemo jer je obavezno, zato invalid token ne može sačuvati event
        log.setRegistration(null);
        log.setGuest(null);
        log.setScannedToken(request.getToken());
        log.setScanResult(ScanResult.INVALID_TOKEN);
        log.setCheckInMethod(CheckInMethod.QR_SCAN);
        log.setScannedBy(request.getScannedBy());
        log.setDeviceInfo(request.getDeviceInfo());
        log.setMessage(MessageConstants.CHECKIN_INVALID_TOKEN);

        checkInLogRepository.save(log);

    }

    private void saveLog(
            EventRegistration registration,
            String scannedToken,
            ScanResult result,
            CheckInMethod method,
            String scannedBy,
            String deviceInfo,
            String message
    ) {
        CheckInLog log = new CheckInLog();
        log.setEvent(registration.getEvent());
        log.setRegistration(registration);
        log.setGuest(registration.getGuest());
        log.setScannedToken(scannedToken);
        log.setScanResult(result);
        log.setCheckInMethod(method);
        log.setScannedBy(scannedBy);
        log.setDeviceInfo(deviceInfo);
        log.setMessage(message);

        checkInLogRepository.save(log);
    }
}
