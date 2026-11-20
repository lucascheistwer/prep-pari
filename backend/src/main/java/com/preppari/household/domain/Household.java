package com.preppari.household.domain;

import com.preppari.shared.domain.DomainException;
import com.preppari.shared.domain.HouseholdId;
import com.preppari.shared.domain.UserId;
import java.time.DateTimeException;
import java.time.Instant;
import java.time.ZoneId;

public record Household(
    HouseholdId id,
    String name,
    String timezone,
    UserId createdBy,
    Instant createdAt,
    Instant updatedAt) {

  public static final String DEFAULT_TIMEZONE = "America/Argentina/Buenos_Aires";

  public Household {
    if (id == null || createdBy == null || createdAt == null || updatedAt == null) {
      throw new IllegalArgumentException("El hogar está incompleto.");
    }
    name = cleanName(name);
    timezone = cleanTimezone(timezone);
  }

  public static Household create(
      HouseholdId id, String name, String timezone, UserId createdBy, Instant now) {
    return new Household(id, name, timezone, createdBy, now, now);
  }

  public static String cleanName(String name) {
    String normalized = name == null ? "" : name.trim().replaceAll("\\s+", " ");
    if (normalized.isEmpty() || normalized.length() > 80) {
      throw new DomainException(
          "INVALID_HOUSEHOLD_NAME",
          normalized.isEmpty() ? "El hogar necesita un nombre." : "Ese nombre es demasiado largo.");
    }
    return normalized;
  }

  public static String cleanTimezone(String timezone) {
    String zone = timezone == null || timezone.isBlank() ? DEFAULT_TIMEZONE : timezone.trim();
    try {
      ZoneId.of(zone);
    } catch (DateTimeException ex) {
      throw new DomainException("INVALID_TIMEZONE", "La zona horaria no es válida.");
    }
    return zone;
  }
}
