package com.preppari.shared.domain;

import java.util.UUID;

public record HouseholdId(UUID value) {

  public HouseholdId {
    if (value == null) {
      throw new IllegalArgumentException("El hogar es obligatorio.");
    }
  }
}
