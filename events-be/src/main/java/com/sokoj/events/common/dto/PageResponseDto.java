package com.sokoj.events.common.dto;

import lombok.Data;

import java.util.List;

@Data
public class PageResponseDto<T> {

    private List<T> content;

    private int page;
    private int size;

    private long totalElements;
    private int totalPages;

    private boolean first;
    private boolean last;
}