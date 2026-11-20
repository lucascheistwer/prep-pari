package com.preppari.dish.application.port.out;

import java.util.List;

public record EnrichedDishData(
    String title, int baseServings, String category, List<SuggestedIngredient> ingredients) {}
