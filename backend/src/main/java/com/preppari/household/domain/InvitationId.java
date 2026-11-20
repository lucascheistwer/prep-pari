package com.preppari.household.domain;

import java.util.UUID;

public record InvitationId(UUID value) {

  public InvitationId {
    if (value == null) {
      throw new IllegalArgumentException("La invitación es obligatoria.");
    }
  }
}
