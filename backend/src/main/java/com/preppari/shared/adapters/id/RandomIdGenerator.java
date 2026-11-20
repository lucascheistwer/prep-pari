package com.preppari.shared.adapters.id;

import com.preppari.shared.application.IdGeneratorPort;
import java.util.UUID;
import org.springframework.stereotype.Component;

@Component
public class RandomIdGenerator implements IdGeneratorPort {

  @Override
  public UUID newId() {
    return UUID.randomUUID();
  }
}
