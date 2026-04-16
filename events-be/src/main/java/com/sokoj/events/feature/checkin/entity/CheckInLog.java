package com.sokoj.events.feature.checkin.entity;

import com.sokoj.events.feature.checkin.enums.CheckInMethod;
import com.sokoj.events.feature.checkin.enums.ScanResult;
import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.registration.entity.EventRegistration;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(name = "checkin_logs")
public class CheckInLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id")
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "registration_id")
    private EventRegistration registration;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id")
    private Guest guest;

    @Column(name = "scanned_token", length = 255)
    private String scannedToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "scan_result", nullable = false, length = 50)
    private ScanResult scanResult;

    @Enumerated(EnumType.STRING)
    @Column(name = "checkin_method", nullable = false, length = 30)
    private CheckInMethod checkInMethod;

    @Column(name = "scanned_by", length = 255)
    private String scannedBy;

    @Column(name = "device_info", length = 255)
    private String deviceInfo;

    @Column(length = 500)
    private String message;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}