package com.preppari.identity.application;

import com.preppari.identity.domain.ExternalSubject;
import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UnavailableException;
import java.time.Duration;
import java.time.Instant;

public final class GoogleIdentityRules {

  public static final String ISSUER_HTTPS = "https://accounts.google.com";
  public static final String ISSUER_BARE = "accounts.google.com";
  public static final Duration CLOCK_SKEW = Duration.ofSeconds(60);

  private GoogleIdentityRules() {}

  public static VerifiedIdentity verify(GoogleTokenClaims claims, String clientId, Instant now) {
    if (clientId == null || clientId.isBlank()) {
      throw new UnavailableException(
          "AUTH_PROVIDER_NOT_CONFIGURED", "Ahora no se puede entrar con Google.");
    }
    if (claims == null
        || (!ISSUER_HTTPS.equals(claims.issuer()) && !ISSUER_BARE.equals(claims.issuer()))) {
      throw invalid();
    }
    if (claims.audience() == null || !claims.audience().contains(clientId)) {
      throw invalid();
    }
    if (claims.expiresAt() == null || claims.expiresAt().plus(CLOCK_SKEW).isBefore(now)) {
      throw invalid();
    }
    if (!Boolean.TRUE.equals(claims.emailVerified())
        || claims.email() == null
        || claims.email().isBlank()) {
      throw new UnauthorizedException(
          "EMAIL_NOT_VERIFIED", "No pudimos usar esa cuenta de Google.");
    }
    ExternalSubject subject;
    try {
      subject = ExternalSubject.google(claims.subject());
    } catch (IllegalArgumentException ex) {
      throw invalid();
    }
    String name = claims.name() == null || claims.name().isBlank() ? claims.email() : claims.name();
    return new VerifiedIdentity(subject, claims.email(), name);
  }

  private static UnauthorizedException invalid() {
    return new UnauthorizedException(
        "INVALID_IDENTITY_TOKEN", "No pudimos entrar con Google. Intentá de nuevo.");
  }
}
