package com.preppari.bootstrap.configuration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class AiProviderGuard {

  private static final Logger log = LoggerFactory.getLogger(AiProviderGuard.class);

  public AiProviderGuard(AiProperties properties) {
    if (!"fake".equals(properties.getProvider())) {
      throw new IllegalStateException(
          "El proveedor de IA '"
              + properties.getProvider()
              + "' no está implementado. Usá PREPPARI_AI_PROVIDER=fake hasta la Fase 2.");
    }
    log.info(
        "Proveedor de IA: fake. Modelo de texto: {}. Modelo de imagen: {}. Generación de imagen: {}.",
        blank(properties.getTextModel()),
        blank(properties.getImageModel()),
        properties.isImageGenerationEnabled());
  }

  private static String blank(String value) {
    return value == null || value.isBlank() ? "(sin definir)" : value;
  }
}
