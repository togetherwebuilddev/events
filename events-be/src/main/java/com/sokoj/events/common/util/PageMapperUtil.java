package com.sokoj.events.common.util;

import com.sokoj.events.common.dto.PageResponseDto;
import org.springframework.data.domain.Page;

public final class PageMapperUtil {

    private PageMapperUtil() {
    }

    public static <T> PageResponseDto<T> toPageResponse(Page<T> page) {
        PageResponseDto<T> response = new PageResponseDto();
        response.setContent(page.getContent());
        response.setPage(page.getNumber());
        response.setSize(page.getSize());
        response.setTotalElements(page.getTotalElements());
        response.setTotalPages(page.getTotalPages());
        response.setFirst(page.isFirst());
        response.setLast(page.isLast());
        return response;
    }
}