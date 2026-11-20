package com.preppari.bootstrap.configuration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class AiProviderGuardTest {

  @Test
  void acceptsTheFakeProviderAndEmptyModels() {
    AiProperties properties = new AiProperties();

    assertThatCode(() -> new AiProviderGuard(properties)).doesNotThrowAnyException();
    assertThatCode(
            () -> {
              if (!properties.getTextModel().isEmpty() || !properties.getImageModel().isEmpty()) {
                throw new AssertionError("el modelo no debe tener un valor por defecto");
              }
            })
        .doesNotThrowAnyException();
  }

  @Test
  void rejectsAnUnimplementedProvider() {
    AiProperties properties = new AiProperties();
    properties.setProvider("gemini");

    assertThatThrownBy(() -> new AiProviderGuard(properties))
        .isInstanceOf(IllegalStateException.class)
        .hasMessageContaining("fake");
  }
}
