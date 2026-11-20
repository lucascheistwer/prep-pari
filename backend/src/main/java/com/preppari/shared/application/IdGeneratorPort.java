package com.preppari.shared.application;

import java.util.UUID;

public interface IdGeneratorPort {

  UUID newId();
}
