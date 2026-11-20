package com.preppari.dish.adapters.out.ai;

import com.preppari.dish.application.port.out.DishImagePort;
import com.preppari.dish.application.port.out.GeneratedImage;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "preppari.ai.provider", havingValue = "fake", matchIfMissing = true)
public class FakeDishImageAdapter implements DishImagePort {

  static final String NOT_READY =
      "La imagen de comidas llega en la Fase 2. El proveedor fake no llama a ningún modelo.";

  @Override
  public GeneratedImage generateDishImage(String title, String category) {
    throw new UnsupportedOperationException(NOT_READY);
  }
}
