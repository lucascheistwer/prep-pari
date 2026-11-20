package com.preppari.identity.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UnavailableException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;

class GoogleIdentityRulesTest {

  private static final Instant NOW = Instant.parse("2026-11-20T15:00:00Z");
  private static final String CLIENT_ID = "client-de-prueba.apps.googleusercontent.com";

  @Test
  void acceptsAVerifiedGoogleTokenFromEitherIssuer() {
    VerifiedIdentity identity =
        GoogleIdentityRules.verify(claims(GoogleIdentityRules.ISSUER_HTTPS), CLIENT_ID, NOW);

    assertThat(identity.subject().value()).isEqualTo("google:123456");
    assertThat(identity.email()).isEqualTo("ana@example.com");
    assertThat(identity.displayName()).isEqualTo("Ana Pérez");
    assertThat(
            GoogleIdentityRules.verify(
                    new GoogleTokenClaims(
                        GoogleIdentityRules.ISSUER_BARE,
                        List.of(CLIENT_ID),
                        "123456",
                        "ana@example.com",
                        true,
                        "Ana",
                        NOW.plusSeconds(30)),
                    CLIENT_ID,
                    NOW)
                .subject()
                .value())
        .isEqualTo("google:123456");
  }

  @Test
  void allowsSixtySecondsOfClockSkewAndRejectsTheRest() {
    GoogleTokenClaims almostExpired =
        new GoogleTokenClaims(
            GoogleIdentityRules.ISSUER_HTTPS,
            List.of(CLIENT_ID),
            "123456",
            "ana@example.com",
            true,
            "Ana",
            NOW.minusSeconds(60));
    GoogleTokenClaims expired =
        new GoogleTokenClaims(
            GoogleIdentityRules.ISSUER_HTTPS,
            List.of(CLIENT_ID),
            "123456",
            "ana@example.com",
            true,
            "Ana",
            NOW.minusSeconds(61));

    assertThat(GoogleIdentityRules.verify(almostExpired, CLIENT_ID, NOW).email())
        .isEqualTo("ana@example.com");
    assertThatThrownBy(() -> GoogleIdentityRules.verify(expired, CLIENT_ID, NOW))
        .isInstanceOf(UnauthorizedException.class)
        .extracting("code")
        .isEqualTo("INVALID_IDENTITY_TOKEN");
  }

  @Test
  void rejectsAWrongAudienceIssuerOrUnverifiedEmail() {
    assertThatThrownBy(
            () ->
                GoogleIdentityRules.verify(
                    new GoogleTokenClaims(
                        GoogleIdentityRules.ISSUER_HTTPS,
                        List.of("otro-cliente"),
                        "123456",
                        "ana@example.com",
                        true,
                        "Ana",
                        NOW.plusSeconds(60)),
                    CLIENT_ID,
                    NOW))
        .isInstanceOf(UnauthorizedException.class);
    assertThatThrownBy(
            () ->
                GoogleIdentityRules.verify(
                    new GoogleTokenClaims(
                        "https://evil.example",
                        List.of(CLIENT_ID),
                        "123456",
                        "ana@example.com",
                        true,
                        "Ana",
                        NOW.plusSeconds(60)),
                    CLIENT_ID,
                    NOW))
        .isInstanceOf(UnauthorizedException.class);
    assertThatThrownBy(
            () ->
                GoogleIdentityRules.verify(
                    new GoogleTokenClaims(
                        GoogleIdentityRules.ISSUER_HTTPS,
                        List.of(CLIENT_ID),
                        "123456",
                        "ana@example.com",
                        false,
                        "Ana",
                        NOW.plusSeconds(60)),
                    CLIENT_ID,
                    NOW))
        .isInstanceOf(UnauthorizedException.class)
        .extracting("code")
        .isEqualTo("EMAIL_NOT_VERIFIED");
  }

  @Test
  void refusesToRunWithoutAClientId() {
    assertThatThrownBy(
            () -> GoogleIdentityRules.verify(claims(GoogleIdentityRules.ISSUER_HTTPS), " ", NOW))
        .isInstanceOf(UnavailableException.class)
        .extracting("code")
        .isEqualTo("AUTH_PROVIDER_NOT_CONFIGURED");
  }

  private static GoogleTokenClaims claims(String issuer) {
    return new GoogleTokenClaims(
        issuer,
        List.of(CLIENT_ID),
        "123456",
        "ana@example.com",
        true,
        "Ana Pérez",
        NOW.plusSeconds(3600));
  }
}
