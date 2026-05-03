package com.sokoj.events.feature.event.repository;

import com.sokoj.events.feature.event.entity.Event;
import org.springframework.data.jpa.domain.Specification;

public final class EventSpecification {

    private EventSpecification() {
    }

    public static Specification<Event> search(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String like = "%" + search.trim().toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("name")), like),
                    cb.like(cb.lower(root.get("slug")), like),
                    cb.like(cb.lower(root.get("location")), like)
            );
        };
    }
}