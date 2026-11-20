package com.preppari.jobs.application;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class JobErrorMessagesTest {

  @Test
  void flattensAndTruncates() {
    assertThat(JobErrorMessages.sanitize(null)).isNull();
    assertThat(JobErrorMessages.sanitize("  ")).isNull();
    assertThat(JobErrorMessages.sanitize("linea\n\tok")).isEqualTo("linea ok");
    assertThat(JobErrorMessages.sanitize("a".repeat(800))).hasSize(JobErrorMessages.MAX_LENGTH);
  }
}
