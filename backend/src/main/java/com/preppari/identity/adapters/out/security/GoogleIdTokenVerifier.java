package com.preppari.identity.adapters.out.security;

import com.preppari.identity.application.ExternalIdentityVerifier;
import com.preppari.identity.application.GoogleIdentityRules;
import com.preppari.identity.application.GoogleTokenClaims;
import com.preppari.identity.application.VerifiedIdentity;
import com.preppari.shared.application.ClockPort;
import com.preppari.shared.domain.UnauthorizedException;
import com.preppari.shared.domain.UnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class GoogleIdTokenVerifier implements ExternalIdentityVerifier {

  private static final Logger log = LoggerFactory.getLogger(GoogleIdTokenVerifier.class);

  private final SignedGoogleTokenReader reader;
  private final String clientId;
  private final ClockPort clock;

  public GoogleIdTokenVerifier(SignedGoogleTokenReader reader, String clientId, ClockPort clock) {
    this.reader = reader;
    this.clientId = clientId;
    this.clock = clock;
  }

  @Override
  public VerifiedIdentity verify(String idToken) {
    if (clientId == null || clientId.isBlank()) {
      throw new UnavailableException(
          "AUTH_PROVIDER_NOT_CONFIGURED", "Ahora no se puede entrar con Google.");
    }
    GoogleTokenClaims claims;
    try {
      claims = reader.read(idToken);
    } catch (GoogleTokenUnavailable ex) {
      log.warn("No se pudo validar el ingreso con Google.");
      throw new UnavailableException(
          "AUTH_PROVIDER_UNAVAILABLE", "No pudimos entrar con Google. Intentá de nuevo.");
    } catch (RuntimeException ex) {
      throw new UnauthorizedException(
          "INVALID_IDENTITY_TOKEN", "No pudimos entrar con Google. Intentá de nuevo.");
    }
    return GoogleIdentityRules.verify(claims, clientId, clock.now());
  }
}
