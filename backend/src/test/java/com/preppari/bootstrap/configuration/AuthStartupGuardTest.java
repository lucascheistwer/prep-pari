package com.preppari.bootstrap.configuration;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AuthStartupGuardTest {

  private static final String SECRET = "test-session-secret-at-least-32-chars";

  @Test
  void productionRejectsDevLoginTheTestVerifierAndTheLocalSecret() {
    assertThatThrownBy(() -> AuthStartupGuard.check(true, true, SECRET, "google"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("desarrollo");
    assertThatThrownBy(() -> AuthStartupGuard.check(true, false, SECRET, "test"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("test");
    assertThatThrownBy(
            () ->
                AuthStartupGuard.check(
                    true, false, AuthStartupGuard.LOCAL_DEFAULT_SECRET, "google"))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("desarrollo");
    assertThatThrownBy(() -> AuthStartupGuard.check(false, true, "corta", "google"))
        .isInstanceOf(IllegalStateException.class);
  }

  @Test
  void localCanUseDevLoginAndTheDefaultSecret() {
    AuthStartupGuard.check(false, true, AuthStartupGuard.LOCAL_DEFAULT_SECRET, "google");
    AuthStartupGuard.check(false, true, SECRET, "test");
  }
}
