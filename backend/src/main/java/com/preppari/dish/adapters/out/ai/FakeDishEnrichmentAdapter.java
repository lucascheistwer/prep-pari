package com.preppari.dish.adapters.out.ai;

import com.preppari.dish.application.port.out.DishEnrichmentPort;
import com.preppari.dish.application.port.out.EnrichedDishData;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "preppari.ai.provider", havingValue = "fake", matchIfMissing = true)
public class FakeDishEnrichmentAdapter implements DishEnrichmentPort {

  static final String NOT_READY =
      "El enriquecimiento de comidas llega en la Fase 2. El proveedor fake no llama a ningún modelo.";

  @Override
  public EnrichedDishData enrichFromTitle(String title, int suggestedServings) {
    throw new UnsupportedOperationException(NOT_READY);
  }
}
