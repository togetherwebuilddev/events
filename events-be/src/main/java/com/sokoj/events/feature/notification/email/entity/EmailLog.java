package com.sokoj.events.feature.notification.email.entity;

import com.sokoj.events.feature.event.entity.Event;
import com.sokoj.events.feature.guest.entity.Guest;
import com.sokoj.events.feature.notification.email.enums.EmailStatus;
import com.sokoj.events.feature.notification.email.enums.EmailType;
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
@Table(name = "email_logs")
public class EmailLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "registration_id", nullable = false)
    private EventRegistration registration;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "guest_id", nullable = false)
    private Guest guest;

    @Column(name = "email_to", nullable = false, length = 255)
    private String emailTo;

    @Column(nullable = false, length = 255)
    private String subject;

    @Enumerated(EnumType.STRING)
    @Column(name = "email_type", nullable = false, length = 30)
    private EmailType emailType;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private EmailStatus status;

    @Column(name = "error_message", length = 1000)
    private String errorMessage;

    @Column(name = "sent_at")
    private LocalDateTime sentAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}