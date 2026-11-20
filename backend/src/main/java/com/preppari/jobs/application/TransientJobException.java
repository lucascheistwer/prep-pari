package com.preppari.jobs.application;

public class TransientJobException extends RuntimeException {

  private final String code;

  public TransientJobException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
