package com.wifiextender.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtUtil {

    @Value("${app.jwt.secret}")
    private String secret;

    @Value("${app.jwt.access-expiration:900000}")
    private long accessExpiration;   // 15 minutes default

    @Value("${app.jwt.refresh-expiration:604800000}")
    private long refreshExpiration;  // 7 days default

    private Key key() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    // ── Access token (short-lived, carries role) ──────────────────────────────
    public String generateAccessToken(String email, String role) {
        return Jwts.builder()
                .setSubject(email)
                .claim("role", role)
                .claim("type", "access")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + accessExpiration))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    // ── Refresh token (long-lived, opaque UUID signed) ────────────────────────
    public String generateRefreshToken(String email) {
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "refresh")
                .setId(UUID.randomUUID().toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + refreshExpiration))
                .signWith(key(), SignatureAlgorithm.HS256)
                .compact();
    }

    public String extractEmail(String token) {
        return parseClaims(token).getSubject();
    }

    public String extractRole(String token) {
        return (String) parseClaims(token).get("role");
    }

    public String extractType(String token) {
        return (String) parseClaims(token).get("type");
    }

    public long getRefreshExpirationMs() {
        return refreshExpiration;
    }

    public boolean validateAccessToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return "access".equals(claims.get("type"));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean validateRefreshToken(String token) {
        try {
            Claims claims = parseClaims(token);
            return "refresh".equals(claims.get("type"));
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}
