package com.preppari.identity.domain;

public record ExternalSubject(String value) {

  public ExternalSubject {
    if (value == null || value.isBlank() || value.length() > 320) {
      throw new IllegalArgumentException("El subject externo es inválido.");
    }
  }

  public static ExternalSubject google(String subject) {
    return of("google", subject);
  }

  public static ExternalSubject dev(String subject) {
    return of("dev", subject);
  }

  private static ExternalSubject of(String provider, String subject) {
    if (subject == null || !subject.matches("[A-Za-z0-9._\\-]{1,255}")) {
      throw new IllegalArgumentException("El subject externo es inválido.");
    }
    return new ExternalSubject(provider + ":" + subject);
  }
}
