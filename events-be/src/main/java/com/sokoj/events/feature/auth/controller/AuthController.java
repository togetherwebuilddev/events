package com.sokoj.events.feature.auth.controller;

import com.sokoj.events.feature.auth.dto.AuthUserDto;
import com.sokoj.events.feature.auth.dto.LoginRequestDto;
import com.sokoj.events.feature.auth.dto.RegisterRequestDto;
import com.sokoj.events.feature.auth.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/csrf")
    public Map<String, String> csrf(HttpServletRequest request) {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute("_csrf");
        return authService.csrf(csrfToken);
    }

    @PostMapping("/register")
    public AuthUserDto register(@Valid @RequestBody RegisterRequestDto request) {
        return authService.register(request);
    }

    @PostMapping("/login")
    public AuthUserDto login(
            @Valid @RequestBody LoginRequestDto request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse
    ) {
        return authService.login(request, httpRequest, httpResponse);
    }

    @PostMapping("/logout")
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        authService.logout(request, response, authentication);
    }

    @GetMapping("/me")
    public AuthUserDto me(Authentication authentication) {
        return authService.me(authentication);
    }
}
