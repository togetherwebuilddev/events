package com.sokoj.events.feature.checkin.repository;

import com.sokoj.events.feature.checkin.entity.CheckInLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CheckInLogRepository extends JpaRepository<CheckInLog, Long> {
}
