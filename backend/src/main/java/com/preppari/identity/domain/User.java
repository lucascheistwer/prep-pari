package com.preppari.identity.domain;

import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.UserId;
import java.time.Instant;

public record User(
    UserId id,
    ExternalSubject externalSubject,
    String email,
    String displayName,
    Instant createdAt,
    Instant updatedAt) {

  public User {
    if (id == null || externalSubject == null || createdAt == null || updatedAt == null) {
      throw new IllegalArgumentException("El usuario está incompleto.");
    }
    email = normalizeEmail(email);
    displayName = normalizeName(displayName);
  }

  public static User register(
      UserId id, ExternalSubject externalSubject, String email, String displayName, Instant now) {
    return new User(id, externalSubject, email, displayName, now, now);
  }

  public User withProfile(String email, String displayName, Instant now) {
    return new User(id, externalSubject, email, displayName, createdAt, now);
  }

  static String normalizeEmail(String email) {
    if (email == null || email.isBlank()) {
      return null;
    }
    String normalized = email.trim().toLowerCase();
    if (normalized.length() > 320 || !normalized.contains("@")) {
      throw new DomainException("INVALID_EMAIL", "El email no es válido.");
    }
    return normalized;
  }

  static String normalizeName(String displayName) {
    String normalized = displayName == null ? "" : displayName.trim().replaceAll("\\s+", " ");
    if (normalized.isEmpty()) {
      normalized = "Sin nombre";
    }
    if (normalized.length() > 120) {
      normalized = normalized.substring(0, 120).trim();
    }
    return normalized;
  }
}
