package com.sokoj.events.feature.checkin.repository;

import com.sokoj.events.feature.checkin.entity.CheckInLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface CheckInLogRepository extends JpaRepository<CheckInLog, Long> {

    @Modifying
    @Transactional
    @Query(value = "delete from checkin_logs where registration_id = :registrationId", nativeQuery = true)
    void deleteAllByRegistrationId(@Param("registrationId") Long registrationId);

    @Modifying
    @Transactional
    @Query(value = "delete from checkin_logs where guest_id = :guestId", nativeQuery = true)
    void deleteAllByGuestId(@Param("guestId") Long guestId);
}
