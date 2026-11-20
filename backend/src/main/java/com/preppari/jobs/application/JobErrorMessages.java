package com.preppari.jobs.application;

public final class JobErrorMessages {

  public static final int MAX_LENGTH = 500;

  private JobErrorMessages() {}

  public static String sanitize(String message) {
    if (message == null || message.isBlank()) {
      return null;
    }
    String flat = message.replaceAll("[\\r\\n\\t]+", " ").trim();
    if (flat.length() <= MAX_LENGTH) {
      return flat;
    }
    return flat.substring(0, MAX_LENGTH);
  }
}
