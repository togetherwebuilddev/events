package com.sokoj.events.feature.registration.repository;

import com.sokoj.events.feature.registration.entity.EventRegistration;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {

    boolean existsByEventIdAndGuestId(Long eventId, Long guestId);

    boolean existsByQrToken(String qrToken);

    Optional<EventRegistration> findByQrToken(String qrToken);
}