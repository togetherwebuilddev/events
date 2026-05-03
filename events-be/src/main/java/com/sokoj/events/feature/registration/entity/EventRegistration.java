package com.sokoj.events.feature.registration.entity;

import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.registration.enums.AttendanceStatus;
import com.sokoj.events.feature.registration.enums.InvitationStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "event_registrations",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_event_guest", columnNames = {"event_id", "guest_id"}),
                @UniqueConstraint(name = "uk_registration_qr_token", columnNames = {"qr_token"})
        }
)
public class EventRegistration {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Column(name = "qr_token", nullable = false, unique = true, length = 255)
    private String qrToken;

    @Enumerated(EnumType.STRING)
    @Column(name = "invitation_status", nullable = false, length = 30)
    private InvitationStatus invitationStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "attendance_status", nullable = false, length = 30)
    private AttendanceStatus attendanceStatus;

    @Column(name = "invitation_sent_at")
    private LocalDateTime invitationSentAt;

    @Column(name = "checked_in_at")
    private LocalDateTime checkedInAt;

    @Column(name = "checked_in_by", length = 255)
    private String checkedInBy;

    @Column(name = "manual_check_in_reason", length = 255)
    private String manualCheckInReason;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "canceled_at")
    private LocalDateTime canceledAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;

        if (this.invitationStatus == null) {
            this.invitationStatus = InvitationStatus.PENDING;
        }

        if (this.attendanceStatus == null) {
            this.attendanceStatus = AttendanceStatus.NOT_ARRIVED;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
