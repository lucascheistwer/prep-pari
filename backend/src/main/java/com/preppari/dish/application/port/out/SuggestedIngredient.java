package com.preppari.dish.application.port.out;

import java.math.BigDecimal;

/**
 * Sugerencia de un proveedor de IA. No es un ingrediente confirmado. La validación del schema llega
 * con el enriquecimiento, en la Fase 2.
 */
public record SuggestedIngredient(
    String name,
    String normalizedName,
    BigDecimal quantity,
    String unit,
    String category,
    String source,
    BigDecimal confidence,
    String note) {}
