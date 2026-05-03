package com.sokoj.events.feature.guest.repository;

import com.sokoj.events.feature.guest.entity.Guest;
import org.springframework.data.jpa.domain.Specification;

public final class GuestSpecification {

    private GuestSpecification() {
    }

    public static Specification<Guest> search(String search) {
        return (root, query, cb) -> {
            if (search == null || search.isBlank()) {
                return cb.conjunction();
            }

            String like = "%" + search.trim().toLowerCase() + "%";

            return cb.or(
                    cb.like(cb.lower(root.get("firstName")), like),
                    cb.like(cb.lower(root.get("lastName")), like),
                    cb.like(cb.lower(root.get("email")), like),
                    cb.like(cb.lower(root.get("phone")), like),
                    cb.like(cb.lower(root.get("companyName")), like)
            );
        };
    }
}