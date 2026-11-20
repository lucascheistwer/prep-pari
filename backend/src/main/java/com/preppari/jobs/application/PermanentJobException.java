package com.preppari.jobs.application;

public class PermanentJobException extends RuntimeException {

  private final String code;

  public PermanentJobException(String code, String message) {
    super(message);
    this.code = code;
  }

  public String code() {
    return code;
  }
}
