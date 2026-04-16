package com.sokoj.events.feature.guest.repository;

import com.sokoj.events.feature.guest.entity.Guest;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GuestRepository extends JpaRepository<Guest, Long> {
}
