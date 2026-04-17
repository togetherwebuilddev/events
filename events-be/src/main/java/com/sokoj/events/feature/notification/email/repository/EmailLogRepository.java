package com.sokoj.events.feature.notification.email.repository;

import com.sokoj.events.feature.notification.email.entity.EmailLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailLogRepository extends JpaRepository<EmailLog, Long> {
}
