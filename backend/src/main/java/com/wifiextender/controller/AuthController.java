package com.wifiextender.controller;

import com.wifiextender.dto.AuthDto;
import com.wifiextender.entity.User;
import com.wifiextender.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@Tag(name = "Auth", description = "Register, login, token refresh and logout")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @Operation(summary = "Register a new user account")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "User registered"),
        @ApiResponse(responseCode = "400", description = "Validation error or email already taken")
    })
    @SecurityRequirements   // no auth needed
    @PostMapping("/register")
    public ResponseEntity<AuthDto.AuthResponse> register(@Valid @RequestBody AuthDto.RegisterRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(req));
    }

    @Operation(summary = "Login with email and password")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Login successful"),
        @ApiResponse(responseCode = "400", description = "Invalid credentials"),
        @ApiResponse(responseCode = "403", description = "Account locked or disabled")
    })
    @SecurityRequirements
    @PostMapping("/login")
    public ResponseEntity<AuthDto.AuthResponse> login(@Valid @RequestBody AuthDto.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @Operation(summary = "Refresh access token using refresh token")
    @SecurityRequirements
    @PostMapping("/refresh")
    public ResponseEntity<AuthDto.AuthResponse> refresh(@Valid @RequestBody AuthDto.RefreshRequest req) {
        return ResponseEntity.ok(authService.refresh(req.getRefreshToken()));
    }

    @Operation(summary = "Logout — revokes all refresh tokens")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal User user) {
        authService.logout(user.getId());
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Get current authenticated user profile")
    @GetMapping("/me")
    public ResponseEntity<AuthDto.UserInfo> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(authService.me(user));
    }
}
