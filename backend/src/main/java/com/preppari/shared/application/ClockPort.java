package com.preppari.shared.application;

import java.time.Instant;

public interface ClockPort {

  Instant now();
}
