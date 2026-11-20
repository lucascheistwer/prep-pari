package com.preppari.identity.adapters.out.security;

import com.preppari.identity.application.ExternalIdentityVerifier;
import com.preppari.identity.application.VerifiedIdentity;
import com.preppari.identity.domain.ExternalSubject;
import com.preppari.shared.domain.UnauthorizedException;

/** Acepta tokens `test|subject|email|nombre`. Solo se registra si el verificador es `test`. */
public final class TestExternalIdentityVerifier implements ExternalIdentityVerifier {

  @Override
  public VerifiedIdentity verify(String idToken) {
    if (idToken == null || !idToken.startsWith("test|")) {
      throw invalid();
    }
    String[] parts = idToken.split("\\|", -1);
    if (parts.length != 4 || parts[1].isBlank() || parts[2].isBlank() || parts[3].isBlank()) {
      throw invalid();
    }
    try {
      return new VerifiedIdentity(ExternalSubject.google(parts[1]), parts[2], parts[3]);
    } catch (IllegalArgumentException ex) {
      throw invalid();
    }
  }

  private static UnauthorizedException invalid() {
    return new UnauthorizedException(
        "INVALID_IDENTITY_TOKEN", "No pudimos entrar con Google. Intentá de nuevo.");
  }
}
