package com.preppari.shared.domain;

import java.util.UUID;

public record UserId(UUID value) {

  public UserId {
    if (value == null) {
      throw new IllegalArgumentException("El usuario es obligatorio.");
    }
  }
}
