package com.sokoj.events.feature.auth.service;

import com.sokoj.events.exception.ConflictException;
import com.sokoj.events.exception.MessageConstants;
import com.sokoj.events.exception.NotFoundException;
import com.sokoj.events.feature.auth.dto.AuthUserDto;
import com.sokoj.events.feature.auth.dto.LoginRequestDto;
import com.sokoj.events.feature.auth.dto.RegisterRequestDto;
import com.sokoj.events.feature.auth.entity.AppUser;
import com.sokoj.events.feature.auth.enums.UserRole;
import com.sokoj.events.feature.auth.mapper.AuthMapper;
import com.sokoj.events.feature.auth.repository.AppUserRepository;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AppUserRepository appUserRepository;
    private final AuthMapper authMapper;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;

    @Transactional
    public AuthUserDto register(RegisterRequestDto request) {
        String normalizedEmail = normalizeEmail(request.getEmail());

        if (appUserRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException(MessageConstants.AUTH_EMAIL_ALREADY_EXISTS);
        }

        AppUser user = new AppUser();
        user.setEmail(normalizedEmail);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName().trim());
        user.setLastName(request.getLastName().trim());
        user.setRole(appUserRepository.count() == 0 ? UserRole.ADMIN : UserRole.USER);
        user.setActive(true);

        AppUser savedUser = appUserRepository.save(user);
        return authMapper.toDto(savedUser);
    }

    public AuthUserDto login(LoginRequestDto request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        normalizeEmail(request.getEmail()),
                        request.getPassword()
                )
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUser user = findByEmail(authentication.getName());
        return authMapper.toDto(user);
    }

    public AuthUserDto me(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new NotFoundException(MessageConstants.AUTH_USER_NOT_FOUND);
        }

        AppUser user = findByEmail(authentication.getName());
        return authMapper.toDto(user);
    }

    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        SecurityContext emptyContext = SecurityContextHolder.createEmptyContext();
        securityContextRepository.saveContext(emptyContext, request, response);

        if (request.getSession(false) != null) {
            request.getSession(false).invalidate();
        }

        expireCookie(response, "JSESSIONID");
        expireCookie(response, "XSRF-TOKEN");
    }

    public Map<String, String> csrf(CsrfToken csrfToken) {
        Map<String, String> response = new HashMap<>();
        response.put("token", csrfToken != null ? csrfToken.getToken() : "");
        return response;
    }

    private AppUser findByEmail(String email) {
        return appUserRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException(MessageConstants.AUTH_USER_NOT_FOUND));
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase();
    }

    private void expireCookie(HttpServletResponse response, String name) {
        Cookie cookie = new Cookie(name, "");
        cookie.setHttpOnly("JSESSIONID".equals(name));
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }
}
