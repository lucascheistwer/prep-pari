package com.preppari.shared.domain;

public class UnavailableException extends DomainException {

  public UnavailableException(String code, String message) {
    super(code, message);
  }
}
