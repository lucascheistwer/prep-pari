package com.preppari.dish.application.port.out;

public interface DishEnrichmentPort {

  EnrichedDishData enrichFromTitle(String title, int suggestedServings);
}
