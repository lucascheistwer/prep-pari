package com.preppari.jobs.application;

import java.time.Duration;
import java.util.List;

public final class RetryBackoff {

  private static final double JITTER_RATIO = 0.2;

  private RetryBackoff() {}

  public static Duration delayForAttempt(int attempt, List<Duration> schedule) {
    if (schedule == null || schedule.isEmpty()) {
      throw new IllegalArgumentException("El calendario de reintentos está vacío");
    }
    int index = Math.min(Math.max(attempt, 1), schedule.size()) - 1;
    return schedule.get(index);
  }

  /** signedUnit está en [-1, 1] y aplica ±20% sobre la demora base. */
  public static Duration withJitter(Duration base, double signedUnit) {
    double clamped = Math.max(-1d, Math.min(1d, signedUnit));
    double factor = 1d + (JITTER_RATIO * clamped);
    long millis = Math.max(0L, Math.round(base.toMillis() * factor));
    return Duration.ofMillis(millis);
  }
}
