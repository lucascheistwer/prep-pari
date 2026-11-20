package com.preppari.shared.domain;

public class UnauthorizedException extends DomainException {

  public UnauthorizedException(String code, String message) {
    super(code, message);
  }
}
