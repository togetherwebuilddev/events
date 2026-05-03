package com.sokoj.events.feature.notification.email.repository;

import com.sokoj.events.feature.notification.email.entity.EmailLog;
import com.sokoj.events.feature.notification.email.enums.EmailStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {

    java.util.Optional<EmailLog> findFirstByRegistration_IdOrderByCreatedAtDesc(Long registrationId);

    java.util.Optional<EmailLog> findFirstByEvent_IdAndEmailToIgnoreCaseAndStatusOrderBySentAtDesc(
            Long eventId,
            String emailTo,
            EmailStatus status
    );

    @Modifying
    @Transactional
    @Query(value = "delete from email_logs where registration_id = :registrationId", nativeQuery = true)
    void deleteAllByRegistrationId(@Param("registrationId") Long registrationId);

    @Modifying
    @Transactional
    @Query(value = "delete from email_logs where guest_id = :guestId", nativeQuery = true)
    void deleteAllByGuestId(@Param("guestId") Long guestId);
}
