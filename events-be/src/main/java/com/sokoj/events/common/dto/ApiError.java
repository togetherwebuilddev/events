package com.sokoj.events.common.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@AllArgsConstructor
public class ApiError {

    private int status;
    private String message;
    private LocalDateTime timestamp;
    private List<FieldErrorDto> fieldErrors;
}