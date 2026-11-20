package com.preppari.identity.adapters.out.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.preppari.shared.domain.UserId;
import java.time.Duration;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class HmacSessionTokensTest {

  private static final Instant ISSUED = Instant.parse("2026-11-20T12:00:00Z");
  private static final String SECRET = "test-session-secret-at-least-32-chars";

  @Test
  void issuesATokenThatExpiresAndRejectsTampering() {
    HmacSessionTokens tokens = new HmacSessionTokens(SECRET, Duration.ofDays(7));
    UserId userId = new UserId(UUID.randomUUID());

    String token = tokens.issue(userId, ISSUED);

    assertThat(tokens.verify(token, ISSUED)).contains(userId);
    assertThat(tokens.verify(token, ISSUED.plus(Duration.ofDays(7)).minusSeconds(1)))
        .contains(userId);
    assertThat(tokens.verify(token, ISSUED.plus(Duration.ofDays(7)))).isEmpty();
    assertThat(tokens.verify(token + "x", ISSUED)).isEmpty();
    assertThat(tokens.verify("no-es-un-jwt", ISSUED)).isEmpty();
    assertThat(new HmacSessionTokens(SECRET + "-otro", Duration.ofDays(7)).verify(token, ISSUED))
        .isEmpty();
  }

  @Test
  void rejectsAShortSecret() {
    assertThatThrownBy(() -> new HmacSessionTokens("corta", Duration.ofDays(1)))
        .isInstanceOf(IllegalStateException.class);
  }
}
