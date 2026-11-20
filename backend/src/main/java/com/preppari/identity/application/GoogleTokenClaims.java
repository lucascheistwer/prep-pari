package com.preppari.identity.application;

import java.time.Instant;
import java.util.List;

public record GoogleTokenClaims(
    String issuer,
    List<String> audience,
    String subject,
    String email,
    Boolean emailVerified,
    String name,
    Instant expiresAt) {}
