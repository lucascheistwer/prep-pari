package com.preppari.dish.adapters.out.ai;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class FakeDishEnrichmentAdapterTest {

  @Test
  void doesNotCallAModel() {
    FakeDishEnrichmentAdapter adapter = new FakeDishEnrichmentAdapter();

    assertThatThrownBy(() -> adapter.enrichFromTitle("Tarta de verduras", 4))
        .isInstanceOf(UnsupportedOperationException.class)
        .hasMessage(FakeDishEnrichmentAdapter.NOT_READY);
    assertThatThrownBy(() -> new FakeDishImageAdapter().generateDishImage("Tarta", "OTROS"))
        .isInstanceOf(UnsupportedOperationException.class)
        .hasMessage(FakeDishImageAdapter.NOT_READY);
  }
}
