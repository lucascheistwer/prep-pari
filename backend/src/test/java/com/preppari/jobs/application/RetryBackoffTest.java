package com.preppari.jobs.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;

class RetryBackoffTest {

  private final List<Duration> schedule =
      List.of(
          Duration.ofSeconds(5),
          Duration.ofSeconds(30),
          Duration.ofMinutes(2),
          Duration.ofMinutes(10),
          Duration.ofMinutes(30));

  @Test
  void usesTheDelayForTheCurrentAttemptAndCapsAtTheLastOne() {
    assertThat(RetryBackoff.delayForAttempt(1, schedule)).isEqualTo(Duration.ofSeconds(5));
    assertThat(RetryBackoff.delayForAttempt(3, schedule)).isEqualTo(Duration.ofMinutes(2));
    assertThat(RetryBackoff.delayForAttempt(9, schedule)).isEqualTo(Duration.ofMinutes(30));
  }

  @Test
  void jitterZeroKeepsTheBaseDelay() {
    assertThat(RetryBackoff.withJitter(Duration.ofSeconds(30), 0))
        .isEqualTo(Duration.ofSeconds(30));
  }

  @Test
  void jitterExtendsAndShrinksWithinTwentyPercent() {
    assertThat(RetryBackoff.withJitter(Duration.ofSeconds(10), 1))
        .isEqualTo(Duration.ofSeconds(12));
    assertThat(RetryBackoff.withJitter(Duration.ofSeconds(10), -1))
        .isEqualTo(Duration.ofSeconds(8));
  }

  @Test
  void rejectsAnEmptySchedule() {
    assertThatThrownBy(() -> RetryBackoff.delayForAttempt(1, List.of()))
        .isInstanceOf(IllegalArgumentException.class);
  }
}
