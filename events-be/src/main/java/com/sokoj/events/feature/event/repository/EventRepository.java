package com.sokoj.events.feature.event.repository;

import com.sokoj.events.feature.event.entity.Event;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EventRepository extends JpaRepository<Event, Long> {
    boolean existsBySlug(String slug);

    Optional<Event> findBySlug(String slug);

}
