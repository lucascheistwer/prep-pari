package com.preppari.bootstrap.configuration;

import java.nio.charset.StandardCharsets;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnWebApplication
public class AuthStartupGuard {

  static final String LOCAL_DEFAULT_SECRET = "local-dev-session-secret-not-for-production-00";

  public AuthStartupGuard(Environment environment, AuthProperties properties) {
    check(
        production(environment),
        properties.isDevLoginEnabled(),
        properties.getSessionSecret(),
        properties.getGoogle().getVerifier());
  }

  static void check(
      boolean production, boolean devLoginEnabled, String sessionSecret, String verifier) {
    if (production && devLoginEnabled) {
      throw new IllegalStateException(
          "El login de desarrollo no puede estar activo en el perfil production.");
    }
    if (production && "test".equals(verifier)) {
      throw new IllegalStateException(
          "El verificador de identidad de test no puede usarse en production.");
    }
    byte[] secret =
        sessionSecret == null ? new byte[0] : sessionSecret.getBytes(StandardCharsets.UTF_8);
    if (secret.length < 32) {
      throw new IllegalStateException("PREPPARI_SESSION_SECRET tiene que tener al menos 32 bytes.");
    }
    if (production && LOCAL_DEFAULT_SECRET.equals(sessionSecret)) {
      throw new IllegalStateException(
          "PREPPARI_SESSION_SECRET de desarrollo no sirve en production.");
    }
  }

  private static boolean production(Environment environment) {
    for (String profile : environment.getActiveProfiles()) {
      if ("production".equals(profile)) {
        return true;
      }
    }
    return false;
  }
}
