package com.preppari;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PrepPariApplicationTest {

  @Test
  void defaultsToTheApiMode() {
    assertThat(PrepPariApplication.resolveMode(new String[0])).isEqualTo("api");
  }

  @Test
  void anArgumentOverridesTheMode() {
    assertThat(PrepPariApplication.resolveMode(new String[] {"--preppari.runtime.mode=worker"}))
        .isEqualTo("worker");
  }
}
