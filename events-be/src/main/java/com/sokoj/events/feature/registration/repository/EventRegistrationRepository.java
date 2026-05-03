package com.sokoj.events.feature.registration.repository;

import com.sokoj.events.feature.registration.entity.EventRegistration;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long>, JpaSpecificationExecutor<EventRegistration> {

    boolean existsByEventIdAndGuestId(Long eventId, Long guestId);

    boolean existsByQrToken(String qrToken);

    Optional<EventRegistration> findByQrToken(String qrToken);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from EventRegistration r where r.id = :id")
    Optional<EventRegistration> findByIdForUpdate(@Param("id") Long id);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from EventRegistration r where r.qrToken = :qrToken")
    Optional<EventRegistration> findByQrTokenForUpdate(@Param("qrToken") String qrToken);

    Optional<EventRegistration> findByEventIdAndGuestId(Long eventId, Long guestId);

    boolean existsByGuestId(Long guestId);

    @Modifying
    @Transactional
    @Query(value = "delete from event_registrations where guest_id = :guestId", nativeQuery = true)
    void deleteAllByGuestId(@Param("guestId") Long guestId);
}
